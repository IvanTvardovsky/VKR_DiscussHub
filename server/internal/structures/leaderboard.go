package structures

type LeaderboardEntry struct {
	Rank          int      `json:"rank"`
	Username      string   `json:"username"`
	Level         string   `json:"level"`
	Score         float64  `json:"score"`
	TotalMessages int      `json:"total_messages"`
	AvgRating     float64  `json:"avg_rating"`
	TotalLikes    int      `json:"total_likes"`
	TotalHours    int      `json:"total_hours"`
	Achievements  []string `json:"achievements"`
	LevelProgress float64  `json:"level_progress"`
}
