import React, { useState, useEffect, useCallback } from 'react';
import { select_next_flag } from './quiz_logic';
import MainMenu from './components/MainMenu';
import MultipleChoiceQuiz from './components/MultipleChoiceQuiz';
import FreeResponseQuiz from './components/FreeResponseQuiz';
import PixelatedQuiz from './components/PixelatedQuiz';
import FrenzyQuiz from './components/FrenzyQuiz';
import Settings from './components/Settings';
import QuizMenu from './components/QuizMenu';
import BonusMenu from './components/BonusMenu';
import LongestRouteQuiz from './components/LongestRouteQuiz'; // New import
import 'App.css';

const DATA_URL = './data/flags.json';

function App() {
    const [flagsData, setFlagsData] = useState([]);
    const [view, setView] = useState('menu');
    const [quizMode, setQuizMode] = useState(null);
    const [quizCategory, setQuizCategory] = useState({ type: 'all', value: null });
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
    const [strictSpelling, setStrictSpelling] = useState(() => localStorage.getItem('strictSpelling') === 'true');
    const [isLoading, setIsLoading] = useState(true);
    const [questionHistory, setQuestionHistory] = useState([]);

    const updateQuestionHistory = useCallback((flagCode) => {
        setQuestionHistory(prev => [...prev.slice(-4), flagCode]);
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('strictSpelling', String(strictSpelling));
    }, [strictSpelling]);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(DATA_URL);
            const freshData = await response.json();
            const savedDataString = localStorage.getItem('flagQuizScores');

            const processFlag = (flag) => ({
                ...flag,
                name: flag.country,
                file: `${flag.code.toLowerCase()}.svg`,
            });

            if (savedDataString) {
                const savedData = JSON.parse(savedDataString);
                const savedDataMap = new Map(savedData.map(flag => [flag.code, flag]));

                const mergedData = freshData.map(freshFlag => {
                    const savedFlag = savedDataMap.get(freshFlag.code);
                    if (savedFlag) {
                        return {
                            correct: 0,
                            incorrect: 0,
                            streak: 0,
                            nextReview: null,
                            lastAnswered: null,
                            ...savedFlag,
                            ...processFlag(freshFlag),
                        };
                    }
                    return {
                        ...processFlag(freshFlag),
                        correct: 0,
                        incorrect: 0,
                        streak: 0,
                        nextReview: null,
                        lastAnswered: null,
                    };
                });
                setFlagsData(mergedData);
            } else {
                const initializedData = freshData.map(flag => ({
                    ...processFlag(flag),
                    correct: 0,
                    incorrect: 0,
                    streak: 0,
                    nextReview: null,
                    lastAnswered: null,
                }));
                setFlagsData(initializedData);
            }
        } catch (error) {
            console.error("Failed to load flags data:", error);
        }
        setIsLoading(false);
    }, []);


    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        if (flagsData.length > 0 && !isLoading) {
            localStorage.setItem('flagQuizScores', JSON.stringify(flagsData));
        }
    }, [flagsData, isLoading]);

    const handleResetStats = () => {
        const isConfirmed = window.confirm("Are you sure you want to reset all your progress? This action cannot be undone.");
        if (isConfirmed) {
            localStorage.removeItem('flagQuizScores');
            localStorage.removeItem('frenzyHighScore');
            localStorage.removeItem('pixelatedHighScore');
            localStorage.removeItem('longestRouteHighScore'); // Reset for new mode
            loadData();
            setView('menu');
        }
    };

    if (isLoading) {
        return <div className="app-container"><h1>Loading Quiz...</h1></div>;
    }

    const renderView = () => {
        const getFilteredFlags = () => {
            const now = Date.now();
            if (quizCategory.type === 'all') {
                return flagsData;
            }
            if (quizCategory.type === 'review') {
                return flagsData.filter(f => f.nextReview !== null && f.nextReview <= now);
            }
            return flagsData.filter(flag =>
                flag.tags.includes(`${quizCategory.type}:${quizCategory.value}`)
            );
        };

        const quizProps = {
            allFlagsData: flagsData,
            setFlagsData: setFlagsData,
            selectNextFlag: select_next_flag,
            setView: setView,
            setQuizCategory: setQuizCategory,
            quizCategory: quizCategory,
            quizMode: quizMode,
            questionHistory: questionHistory,
            updateQuestionHistory: updateQuestionHistory,
        };

        switch (view) {
            case 'quiz-menu':
                return <QuizMenu setView={setView} setQuizCategory={setQuizCategory} flagsData={flagsData} quizMode={quizMode} />;
            case 'multiple-choice':
            case 'free-response':
                const quizFlags = getFilteredFlags();
                if (view === 'multiple-choice') {
                    return <MultipleChoiceQuiz {...quizProps} quizFlags={quizFlags} />;
                }
                return <FreeResponseQuiz {...quizProps} quizFlags={quizFlags} strictSpelling={strictSpelling} />;
            case 'pixelated-quiz':
                return <PixelatedQuiz allFlagsData={flagsData} setView={setView} />;
            case 'frenzy-quiz':
                return <FrenzyQuiz allFlagsData={flagsData} setView={setView} />;
            case 'longest-route-quiz': // New case for Longest Chain
                return <LongestRouteQuiz allFlagsData={flagsData} setView={setView} />;
            case 'bonus-menu':
                return <BonusMenu setView={setView} />;
            case 'settings':
                return (
                    <Settings
                        theme={theme}
                        setTheme={setTheme}
                        strictSpelling={strictSpelling}
                        setStrictSpelling={setStrictSpelling}
                        onResetStats={handleResetStats}
                        setView={setView}
                    />
                );
            case 'menu':
            default:
                return <MainMenu setView={setView} flagsData={flagsData} setQuizMode={setQuizMode} />;
        }
    };

    return (
        <div className="app-container">
            {renderView()}
        </div>
    );
}

export default App;