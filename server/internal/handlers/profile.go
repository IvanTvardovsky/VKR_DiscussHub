package handlers

import (
	"awesomeChat/internal/structures"
	"database/sql"
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func calculateLevel(stats structures.Statistics) (string, float64, string) {
	base := math.Log1p(float64(stats.TotalMessages))
	rating := (stats.Professionalism + stats.ArgumentsQuality + stats.Politeness) / 3
	engagement := math.Min(float64(stats.TotalLikes)/100, 1.0)
	experience := math.Min(float64(stats.TotalHours)/50, 1.0)

	totalScore := (base * 0.4) + (rating * 2 * 0.3) + (engagement * 0.2) + (experience * 0.1)

	levels := []struct {
		Name  string
		Score float64
	}{
		{"🌱 Новичок", 2},
		{"💬 Активный спикер", 4},
		{"🎯 Качественный контрибьютор", 6},
		{"🌟 Топ-участник", 8},
		{"🏆 Мастер дискуссий", 10},
	}

	currentLevel := levels[0].Name
	nextLevel := "Максимум"
	progress := 0.0

	for i, level := range levels {
		if totalScore >= level.Score {
			currentLevel = level.Name
			if i < len(levels)-1 {
				nextLevel = levels[i+1].Name
				progress = (totalScore - level.Score) / (levels[i+1].Score - level.Score)
			} else {
				progress = 1.0
			}
		} else {
			break
		}
	}

	return currentLevel, progress, nextLevel
}

func GetProfile(c *gin.Context, db *sql.DB) {
	username := c.Query("username")
	if username == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "требуется имя пользователя"})
		return
	}

	var userID int
	err := db.QueryRow("SELECT user_id FROM users WHERE username = $1", username).Scan(&userID)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "пользователь не найден"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка получения пользователя"})
		return
	}

	participantsFilter, err := json.Marshal([]string{username})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "внутренняя ошибка"})
		return
	}

	rows, err := db.Query(`
		SELECT id, messages, duration, participants 
		FROM discussions 
		WHERE mode != 'professional' 
		AND participants @> $1::jsonb`,
		string(participantsFilter))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка получения дискуссий"})
		return
	}
	defer rows.Close()

	totalDiscussions := 0
	totalMessages := 0
	totalLikes := 0
	totalDuration := 0
	uniquePartners := make(map[string]struct{})

	for rows.Next() {
		totalDiscussions++
		var (
			discussionID int
			messagesJSON []byte
			durationStr  string
			participants []byte
		)

		if err := rows.Scan(&discussionID, &messagesJSON, &durationStr, &participants); err != nil {
			continue
		}

		duration, _ := time.ParseDuration(durationStr)
		totalDuration += int(duration.Minutes())

		var parts []string
		if err := json.Unmarshal(participants, &parts); err == nil {
			for _, p := range parts {
				if p != username {
					uniquePartners[p] = struct{}{}
				}
			}
		}

		var messages []struct {
			Username  string `json:"username"`
			LikeCount int    `json:"likeCount"`
		}
		if err := json.Unmarshal(messagesJSON, &messages); err != nil {
			continue
		}

		for _, msg := range messages {
			if msg.Username == username {
				totalMessages++
				totalLikes += msg.LikeCount
			}
		}
	}

	var (
		professionalism  float64
		argumentsQuality float64
		politeness       float64
	)

	err = db.QueryRow(`
		SELECT 
			COALESCE(AVG(professionalism), 0),
			COALESCE(AVG(arguments_quality), 0),
			COALESCE(AVG(politeness), 0)
		FROM ratings r
		JOIN discussions d ON r.discussion_id = d.id
		WHERE d.mode != 'professional'
		AND r.rated_user_id = $1`, userID).Scan(
		&professionalism,
		&argumentsQuality,
		&politeness,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка получения рейтингов"})
		return
	}

	achievements := []string{}
	if professionalism >= 4.5 {
		achievements = append(achievements, "🏅 Профи общения (проф. ≥4.5)")
	}
	if argumentsQuality >= 4.7 {
		achievements = append(achievements, "💎 Мастер аргументов (качество ≥4.7)")
	}
	if politeness >= 4.8 {
		achievements = append(achievements, "🤝 Дипломат (вежливость ≥4.8)")
	}
	totalHours := totalDuration / 60
	if totalHours > 120 {
		achievements = append(achievements, "⏳ Опытный дебатер (120+ часов)")
	}
	if len(uniquePartners) >= 15 {
		achievements = append(achievements, "👥 Душа компании (15+ собеседников)")
	}

	stats := structures.Statistics{
		TotalDiscussions: totalDiscussions,
		TotalMessages:    totalMessages,
		TotalLikes:       totalLikes,
		Professionalism:  professionalism,
		ArgumentsQuality: argumentsQuality,
		Politeness:       politeness,
		TotalHours:       totalHours,
		UniquePartners:   len(uniquePartners),
	}

	level, progress, nextLevel := calculateLevel(stats)

	baseWeight := 0.4
	rating := (stats.Professionalism + stats.ArgumentsQuality + stats.Politeness) / 3
	ratingWeight := 0.3 * 2
	engagementWeight := 0.2
	experienceWeight := 0.1

	rankingFactors := []string{
		fmt.Sprintf("Сообщения: %d (%.1f%%)", stats.TotalMessages, baseWeight*100),
		fmt.Sprintf("Средний рейтинг: %.1f/5 (%.1f%%)", rating, ratingWeight*100),
		fmt.Sprintf("Лайки: %d (%.1f%%)", stats.TotalLikes, engagementWeight*100),
		fmt.Sprintf("Опыт: %dч (%.1f%%)", stats.TotalHours, experienceWeight*100),
	}

	response := structures.ProfileResponse{
		Username:   username,
		Statistics: stats,
		Gamification: structures.Gamification{
			Level:          level,
			LevelProgress:  math.Round(progress*100) / 100,
			NextLevel:      nextLevel,
			RankingFactors: rankingFactors,
			Achievements:   achievements,
		},
	}

	c.JSON(http.StatusOK, response)
}
