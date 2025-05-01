package handlers

import (
	"awesomeChat/internal/structures"
	"database/sql"
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"sort"

	"github.com/gin-gonic/gin"
)

func GetLeaderboard(c *gin.Context, db *sql.DB) {
	limit := 50
	if l := c.Query("limit"); l != "" {
		fmt.Sscanf(l, "%d", &limit)
		if limit <= 0 {
			limit = 50
		}
	}

	type uinfo struct {
		ID   int
		Name string
	}
	userRows, err := db.Query(`SELECT user_id, username FROM users`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}
	defer userRows.Close()

	var users []uinfo
	for userRows.Next() {
		var u uinfo
		if err := userRows.Scan(&u.ID, &u.Name); err == nil {
			users = append(users, u)
		}
	}

	entries := make([]structures.LeaderboardEntry, 0, len(users))

	for _, u := range users {
		participantsFilter, _ := json.Marshal([]string{u.Name})

		var discussions, msgs, likes, hours int
		err := db.QueryRow(`
			SELECT
				COUNT(DISTINCT d.id) AS discussions,

				COALESCE(SUM(u.msgs), 0) AS messages,
				COALESCE(SUM(u.likes), 0) AS likes,
				COALESCE(
					SUM(EXTRACT(EPOCH FROM d.duration)) / 3600, 0
				)::int AS hours
			FROM   discussions d
			LEFT JOIN LATERAL (
				SELECT
					COUNT(*)                                    AS msgs,
					SUM((e->>'likeCount')::int)                 AS likes
				FROM   jsonb_array_elements(d.messages) AS e
				WHERE  e->>'username' = $2
			) u ON TRUE
			WHERE  d.mode        != 'professional'
			  AND  d.participants @> $1::jsonb`,
			string(participantsFilter), u.Name).Scan(
			&discussions, &msgs, &likes, &hours)
		if err != nil {
			continue
		}

		var prof, arg, pol sql.NullFloat64
		_ = db.QueryRow(`
			SELECT
				AVG(professionalism),
				AVG(arguments_quality),
				AVG(politeness)
			FROM ratings r
			JOIN discussions d ON d.id = r.discussion_id
			WHERE d.mode != 'professional'
			  AND r.rated_user_id = $1`, u.ID).
			Scan(&prof, &arg, &pol)
		avgRating := (prof.Float64 + arg.Float64 + pol.Float64) / 3

		base := math.Log1p(float64(msgs))         // 0.4
		rating := avgRating * 2                   // вес 0.3*2 = 0.6
		engage := math.Min(float64(likes)/100, 1) // 0.2
		exper := math.Min(float64(hours)/50, 1)   // 0.1
		score := base*0.4 + rating*0.3 + engage*0.2 + exper*0.1
		score = math.Round(score*100) / 100 // 2 знака

		level, progress, _ := calculateLevel(structures.Statistics{
			TotalMessages:    msgs,
			TotalLikes:       likes,
			Professionalism:  prof.Float64,
			ArgumentsQuality: arg.Float64,
			Politeness:       pol.Float64,
			TotalHours:       hours,
		})

		entries = append(entries, structures.LeaderboardEntry{
			Username:      u.Name,
			Score:         score,
			TotalMessages: msgs,
			AvgRating:     math.Round(avgRating*10) / 10,
			TotalLikes:    likes,
			TotalHours:    hours,
			Level:         level,
			LevelProgress: progress,
		})
	}

	sort.Slice(entries, func(i, j int) bool { return entries[i].Score > entries[j].Score })
	for i := range entries {
		entries[i].Rank = i + 1
	}
	if len(entries) > limit {
		entries = entries[:limit]
	}

	c.JSON(http.StatusOK, entries)
}
