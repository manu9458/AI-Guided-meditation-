
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MeditationSession } from '../types';
import * as geminiService from '../services/geminiService';
import { decode, decodeAudioData } from '../utils/audioUtils';
import LoadingSpinner from './LoadingSpinner';
import { PlayIcon } from './icons/PlayIcon';
import { PauseIcon } from './icons/PauseIcon';

const MeditationView: React.FC = () => {
    const [session, setSession] = useState<MeditationSession | null>(null);
    const [prompt, setPrompt] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const audioBufferRef = useRef<AudioBuffer | null>(null);

    useEffect(() => {
        if (session?.audioData && !audioBufferRef.current) {
            const initAudio = async () => {
                if (!audioContextRef.current) {
                    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                }
                const audioBytes = decode(session.audioData);
                const buffer = await decodeAudioData(audioBytes, audioContextRef.current, 24000, 1);
                audioBufferRef.current = buffer;
            };
            initAudio();
        }
        
        return () => {
            if (audioSourceRef.current) {
                audioSourceRef.current.stop();
            }
        };
    }, [session]);

    const handleGenerateSession = async () => {
        if (!prompt.trim()) {
            setError('Please enter a description for your meditation.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setSession(null);
        audioBufferRef.current = null;

        try {
            setLoadingMessage('Crafting your meditation script...');
            const details = await geminiService.generateMeditationDetails(prompt);

            setLoadingMessage('Creating your serene visual...');
            const imageBase64 = await geminiService.generateMeditationImage(details.visualTheme);

            setLoadingMessage('Synthesizing your guide\'s voice...');
            const audioBase64 = await geminiService.generateMeditationAudio(details.script);
            
            setSession({
                script: details.script,
                visualTheme: details.visualTheme,
                imageUrl: `data:image/jpeg;base64,${imageBase64}`,
                audioData: audioBase64,
            });

        } catch (e: any) {
            setError(e.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    const togglePlayback = useCallback(() => {
        if (!audioContextRef.current || !audioBufferRef.current) return;

        if (isPlaying) {
            audioSourceRef.current?.stop();
            setIsPlaying(false);
        } else {
            if (audioContextRef.current.state === 'suspended') {
                audioContextRef.current.resume();
            }
            const newSource = audioContextRef.current.createBufferSource();
            newSource.buffer = audioBufferRef.current;
            newSource.connect(audioContextRef.current.destination);
            newSource.start();
            newSource.onended = () => setIsPlaying(false);
            audioSourceRef.current = newSource;
            setIsPlaying(true);
        }
    }, [isPlaying]);
    
    const resetSession = () => {
        if (audioSourceRef.current) {
            audioSourceRef.current.stop();
        }
        audioSourceRef.current = null;
        audioBufferRef.current = null;
        setSession(null);
        setIsPlaying(false);
        setPrompt('');
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <LoadingSpinner />
                <p className="mt-4 text-lg text-slate-300 animate-pulse">{loadingMessage}</p>
            </div>
        );
    }
    
    if (session) {
        return (
            <div className="relative w-full h-[calc(100vh-150px)] rounded-lg overflow-hidden shadow-2xl flex flex-col justify-end" style={{ backgroundImage: `url(${session.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                <div className="absolute inset-0 bg-black/60"></div>
                <div className="relative z-10 p-6 text-white space-y-4 overflow-y-auto">
                    <h2 className="text-2xl font-bold">{session.visualTheme}</h2>
                    <p className="text-base whitespace-pre-wrap font-light leading-relaxed max-h-48 overflow-y-auto">{session.script}</p>
                </div>
                <div className="relative z-10 flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm">
                    <button onClick={resetSession} className="px-4 py-2 text-sm font-semibold text-white bg-slate-600/50 rounded-lg hover:bg-slate-500/50 transition-colors">
                        New Session
                    </button>
                    <button onClick={togglePlayback} className="p-4 bg-indigo-600 rounded-full hover:bg-indigo-500 transition-transform transform hover:scale-110 shadow-lg">
                        {isPlaying ? <PauseIcon /> : <PlayIcon />}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-2">How would you like to meditate?</h2>
            <p className="text-slate-400 text-center mb-6">Describe your ideal session. e.g., "A 5-minute session to relieve stress in a calming rainforest."</p>
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your meditation..."
                className="w-full p-4 bg-slate-800 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 h-32 resize-none"
            />
            {error && <p className="text-red-400 mt-2">{error}</p>}
            <button
                onClick={handleGenerateSession}
                disabled={isLoading}
                className="mt-6 w-full py-3 px-6 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-lg shadow-lg hover:shadow-indigo-500/50 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Create My Session
            </button>
        </div>
    );
};

export default MeditationView;
