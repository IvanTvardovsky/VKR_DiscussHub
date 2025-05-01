import React, { useState, useEffect } from 'react';
import {
    Container,
    Grid,
    Card,
    CardContent,
    Typography,
    Chip,
    Pagination,
    Skeleton,
    useTheme,
    styled,
    IconButton,
    Collapse
} from '@mui/material';
import { QuestionAnswer, People, Public, Lock, ExpandMore, ExpandLess } from '@mui/icons-material';

const ArchiveCard = styled(Card)(({ theme }) => ({
    transition: 'transform 0.2s',
    cursor: 'pointer',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: theme.shadows[4],
    },
}));

const ExpandButton = styled(IconButton)(({ theme }) => ({
    marginLeft: 'auto',
}));

const ArchiveComponent = ({ onSelectDiscussion }) => {
    const [archiveData, setArchiveData] = useState({ data: [], total: 0 });
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [limit] = useState(9);
    const theme = useTheme();
    const [expandedItems, setExpandedItems] = useState({});

    useEffect(() => {
        const fetchArchive = async () => {
            try {
                const username = localStorage.getItem('username');
                if (!username) {
                    console.error('Имя пользователя не найдено');
                    setLoading(false);
                    return;
                }

                const response = await fetch(
                    `http://localhost:8080/archive?username=${encodeURIComponent(username)}&page=${page}&limit=${limit}`
                );

                if (!response.ok) throw new Error('Ошибка запроса');

                const data = await response.json();
                setArchiveData(data);
            } catch (error) {
                console.error('Ошибка загрузки архива:', error);
                setArchiveData({ data: [], total: 0 });
            } finally {
                setLoading(false);
            }
        };

        fetchArchive();
    }, [page, limit]);

    const toggleExpand = (id) => {
        setExpandedItems((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const renderContent = (item) => {
        if (item.mode === 'professional') {
            return (
                <>
                    <Typography variant="subtitle2" color="text.secondary" fontWeight="bold" gutterBottom>
                        Ключевые вопросы:
                    </Typography>
                    {item.key_questions?.map((q, i) => (
                        <Chip
                            key={i}
                            label={q}
                            size="small"
                            sx={{ m: 0.5 }}
                            color="primary"
                        />
                    ))}
                    <Typography variant="subtitle2" color="text.secondary" fontWeight="bold" gutterBottom sx={{ mt: 1 }}>
                        Метки:
                    </Typography>
                    {item.tags?.map((tag, i) => (
                        <Chip
                            key={i}
                            label={tag}
                            size="small"
                            sx={{ m: 0.5 }}
                            variant="outlined"
                        />
                    ))}
                </>
            );
        }

        if (item.subtype === 'blitz') {
            return (
                <>
                    <Typography variant="body2" color="text.secondary">
                        <span style={{ fontWeight: 'bold' }}>Тема:</span> {item.topic}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        <span style={{ fontWeight: 'bold' }}>Подтема:</span> {item.subtopic}
                    </Typography>
                </>
            );
        }

        return (
            <>
                <Typography variant="body2" color="text.secondary">
                    <span style={{ fontWeight: 'bold' }}>Своя тема:</span> {item.custom_topic}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    <span style={{ fontWeight: 'bold' }}>Своя подтема:</span> {item.custom_subtopic}
                </Typography>
            </>
        );
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 4
            }}>
                <QuestionAnswer fontSize="large" />
                Архив дискуссий
            </Typography>

            {loading ? (
                <Grid container spacing={3}>
                    {[...Array(9)].map((_, i) => (
                        <Grid item xs={12} sm={6} md={4} key={i}>
                            <Skeleton variant="rectangular" height={180} />
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <>
                    {archiveData.data.length > 0 ? (
                        <>
                            <Grid container spacing={3}>
                                {archiveData.data.map((item) => {
                                    const isExpanded = expandedItems[item.id] || false;
                                    return (
                                        <Grid item xs={12} sm={6} md={4} key={item.id}>
                                            <ArchiveCard
                                                sx={{
                                                    borderLeft: `4px solid ${
                                                        item.mode === 'professional'
                                                            ? theme.palette.primary.main
                                                            : theme.palette.secondary.main
                                                    }`
                                                }}
                                            >
                                                <CardContent
                                                    onClick={() => onSelectDiscussion(item.id)}
                                                    sx={{ paddingBottom: 0 }}
                                                >
                                                    <div style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        marginBottom: 12
                                                    }}>
                                                        <Typography variant="h6" component="div">
                                                            {item.name}
                                                        </Typography>
                                                        {item.public ? (
                                                            <Public fontSize="small" color="success" />
                                                        ) : (
                                                            <Lock fontSize="small" color="action" />
                                                        )}
                                                    </div>

                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 8,
                                                        marginBottom: 12
                                                    }}>
                                                        <Chip
                                                            label={item.mode === 'professional' ? 'Проф.' : 'Личная'}
                                                            color={item.mode === 'professional' ? 'primary' : 'secondary'}
                                                            size="small"
                                                        />
                                                        {item.mode === 'personal' && (
                                                            <Chip
                                                                label={item.subtype === 'blitz' ? 'Блиц' : 'Свободная'}
                                                                variant="outlined"
                                                                size="small"
                                                            />
                                                        )}
                                                        <People fontSize="small" sx={{ ml: 'auto' }} />
                                                        <Typography variant="caption">
                                                            {item.participants_count || 0}
                                                        </Typography>
                                                    </div>

                                                    <Collapse in={isExpanded} collapsedSize={120}>
                                                        {renderContent(item)}
                                                    </Collapse>
                                                </CardContent>

                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'flex-end',
                                                    padding: '8px 16px 16px'
                                                }}>
                                                    <ExpandButton onClick={() => toggleExpand(item.id)}>
                                                        {isExpanded ? <ExpandLess /> : <ExpandMore />}
                                                    </ExpandButton>
                                                </div>
                                            </ArchiveCard>
                                        </Grid>
                                    );
                                })}
                            </Grid>

                            <Pagination
                                count={Math.ceil(archiveData.total / limit)}
                                page={page}
                                onChange={(_, value) => setPage(value)}
                                sx={{
                                    mt: 4,
                                    display: 'flex',
                                    justifyContent: 'center'
                                }}
                                color="primary"
                            />
                        </>
                    ) : (
                        <Typography variant="body1" textAlign="center" sx={{ mt: 4 }}>
                            Нет дискуссий в архиве
                        </Typography>
                    )}
                </>
            )}
        </Container>
    );
};

export default ArchiveComponent;
