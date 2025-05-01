import React, { useEffect, useState } from 'react';
import {
    Container, Paper, Table, TableBody, TableCell, TableHead, TableRow,
    Avatar, Typography, CircularProgress, Alert, LinearProgress, Box
} from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
    marginTop: theme.spacing(3),
    padding: theme.spacing(3),
    borderRadius: 12,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
}));

const ProgressBar = ({ percent }) => (
    <Box sx={{ width: 120 }}>
        <LinearProgress
            variant="determinate"
            value={percent}
            sx={{ height: 8, borderRadius: 4 }}
        />
    </Box>
);

const LeaderboardComponent = () => {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);

    useEffect(() => {
        fetch('http://127.0.0.1:8080/leaderboard?limit=50')
            .then(r => r.ok ? r.json() : Promise.reject('Ошибка загрузки'))
            .then(setRows)
            .catch(e => setErr(e))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Container sx={{ display:'flex',justifyContent:'center',mt:4 }}><CircularProgress size={60}/></Container>;
    if (err) return <Container sx={{ mt:4 }}><Alert severity="error">{err}</Alert></Container>;

    return (
        <Container maxWidth="lg">
            <StyledPaper>
                <Typography variant="h4" gutterBottom sx={{ fontWeight:600 }}>
                    💎 Лидеры сообщества
                </Typography>

                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>№</TableCell>
                            <TableCell>Участник</TableCell>
                            <TableCell>Уровень</TableCell>
                            <TableCell>Счёт</TableCell>
                            <TableCell>Сообщения</TableCell>
                            <TableCell>★ Рейтинг</TableCell>
                            <TableCell>👍 Лайки</TableCell>
                            <TableCell>⏱ Часы</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {rows.map(r => (
                            <TableRow key={r.username}>
                                <TableCell>{r.rank}</TableCell>
                                <TableCell>
                                    <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                                        <Avatar sx={{ bgcolor:'primary.main' }}>
                                            {r.username[0].toUpperCase()}
                                        </Avatar>
                                        {r.username}
                                    </Box>
                                </TableCell>
                                <TableCell>{r.level}</TableCell>
                                <TableCell>
                                    {r.score.toFixed(2)}
                                    <ProgressBar percent={r.level_progress * 100}/>
                                </TableCell>
                                <TableCell>{r.total_messages}</TableCell>
                                <TableCell>{r.avg_rating.toFixed(1)}</TableCell>
                                <TableCell>{r.total_likes}</TableCell>
                                <TableCell>{r.total_hours}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </StyledPaper>
        </Container>
    );
};

export default LeaderboardComponent;
