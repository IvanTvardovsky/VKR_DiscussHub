package structures

type ProfileResponse struct {
	Username     string       `json:"username"`
	Statistics   Statistics   `json:"statistics"`
	Gamification Gamification `json:"gamification"`
}

type Statistics struct {
	TotalDiscussions int     `json:"total_discussions"`
	TotalMessages    int     `json:"total_messages"`
	TotalLikes       int     `json:"total_likes"`
	Professionalism  float64 `json:"professionalism"`
	ArgumentsQuality float64 `json:"arguments_quality"`
	Politeness       float64 `json:"politeness"`
	TotalHours       int     `json:"total_hours"`
	UniquePartners   int     `json:"unique_partners"`
}

type Gamification struct {
	Level          string   `json:"level"`
	LevelProgress  float64  `json:"level_progress"`
	NextLevel      string   `json:"next_level"`
	Achievements   []string `json:"achievements"`
	RankingFactors []string `json:"ranking_factors"`
}
