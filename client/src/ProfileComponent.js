import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Paper,
    Grid,
    Chip,
    CircularProgress,
    Alert,
    Avatar,
    Divider,
    Box,
    LinearProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3),
    marginTop: theme.spacing(3),
    borderRadius: 12,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
}));

const StatItem = ({ label, value }) => (
    <Grid item xs={6} md={3} sx={{ textAlign: 'center', p: 2 }}>
        <Typography variant="h6" gutterBottom>
            {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
            {label}
        </Typography>
    </Grid>
);

const RatingItem = ({ emoji, label, value }) => (
    <Grid item xs={12} md={4} sx={{ textAlign: 'center', p: 2 }}>
        <Typography variant="h2" sx={{ mb: 1 }}>
            {emoji}
        </Typography>
        <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
            {value.toFixed(1)}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
            {label}
        </Typography>
    </Grid>
);

const LevelProgress = ({ level, progress, nextLevel, factors }) => (
    <Box sx={{ bgcolor: 'background.paper', p: 3, borderRadius: 2, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
            Текущий уровень: <Box component="span" color="primary.main">{level}</Box>
        </Typography>

        <LinearProgress
            variant="determinate"
            value={progress * 100}
            sx={{
                height: 10,
                borderRadius: 5,
                mt: 2,
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                '& .MuiLinearProgress-bar': {
                    borderRadius: 5,
                    backgroundColor: '#4caf50'
                }
            }}
        />

        <Typography variant="body2" sx={{ mt: 1, mb: 3 }}>
            До следующего уровня ({nextLevel}): {Math.round(progress * 100)}%
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" gutterBottom sx={{ mb: 2 }}>
            📈 Факторы роста уровня:
        </Typography>
        <Grid container spacing={1}>
            {factors.map((factor, index) => (
                <Grid item xs={12} key={index}>
                    <Box sx={{
                        bgcolor: 'action.hover',
                        p: 1.5,
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        <Typography variant="body2">
                            {factor}
                        </Typography>
                    </Box>
                </Grid>
            ))}
        </Grid>
    </Box>
);

const ProfileComponent = () => {
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const username = localStorage.getItem('username');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await fetch(
                    `http://127.0.0.1:8080/profile?username=${encodeURIComponent(username)}`
                );

                if (!response.ok) throw new Error('Ошибка загрузки профиля');

                const data = await response.json();
                setProfileData(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [username]);

    if (loading) {
        return (
            <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress size={60} />
            </Container>
        );
    }

    if (error) {
        return (
            <Container sx={{ mt: 4 }}>
                <Alert severity="error" sx={{ fontSize: '1rem' }}>
                    {error}
                </Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="md">
            <StyledPaper>
                <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
                    <Grid item>
                        <Avatar sx={{
                            width: 80,
                            height: 80,
                            bgcolor: 'primary.main',
                            fontSize: '2.5rem'
                        }}>
                            {username?.charAt(0).toUpperCase()}
                        </Avatar>
                    </Grid>
                    <Grid item>
                        <Typography variant="h3" component="h1" sx={{ fontWeight: 600 }}>
                            {username}
                        </Typography>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />
                <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
                    Основная статистика
                </Typography>
                <Grid container spacing={2}>
                    <StatItem label="Дискуссии" value={profileData.statistics.total_discussions} />
                    <StatItem label="Сообщения" value={profileData.statistics.total_messages} />
                    <StatItem label="Лайки" value={profileData.statistics.total_likes} />
                    <StatItem label="Часы в дискуссиях" value={profileData.statistics.total_hours} />
                    <StatItem label="Собеседники" value={profileData.statistics.unique_partners} />
                </Grid>

                <Divider sx={{ my: 3 }} />
                <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
                    Оценки качества
                </Typography>
                <Grid container spacing={2}>
                    <RatingItem
                        emoji="👔"
                        label="Профессионализм"
                        value={profileData.statistics.professionalism}
                    />
                    <RatingItem
                        emoji="💡"
                        label="Качество аргументов"
                        value={profileData.statistics.arguments_quality}
                    />
                    <RatingItem
                        emoji="🤝"
                        label="Вежливость"
                        value={profileData.statistics.politeness}
                    />
                </Grid>

                <LevelProgress
                    level={profileData.gamification.level}
                    progress={profileData.gamification.level_progress}
                    nextLevel={profileData.gamification.next_level}
                    factors={profileData.gamification.ranking_factors}
                />

                {profileData.gamification.achievements.length > 0 && (
                    <>
                        <Divider sx={{ my: 3 }} />
                        <Box sx={{ p: 2 }}>
                            <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
                                🏆 Достижения
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                Награды за выдающиеся результаты в дискуссиях
                            </Typography>
                            <Grid container spacing={2}>
                                {profileData.gamification.achievements.map((ach, index) => (
                                    <Grid item xs={12} sm={6} key={index}>
                                        <Chip
                                            label={ach}
                                            color="secondary"
                                            variant="outlined"
                                            sx={{
                                                fontSize: '1rem',
                                                height: 'auto',
                                                py: 1.5,
                                                '& .MuiChip-label': {
                                                    whiteSpace: 'normal',
                                                    textAlign: 'left'
                                                }
                                            }}
                                        />
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    </>
                )}
            </StyledPaper>
        </Container>
    );
};

export default ProfileComponent;