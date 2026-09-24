import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            try {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error('Failed to parse stored user:', e);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        const { token: jwtToken, user: userData } = response.data;

        setToken(jwtToken);
        setUser(userData);

        localStorage.setItem('token', jwtToken);
        localStorage.setItem('user', JSON.stringify(userData));

        return userData;
    };

    const registerParent = async (formData) => {
        const response = await api.post('/auth/register-parent', formData);
        const { token: jwtToken, user: userData } = response.data;

        setToken(jwtToken);
        setUser(userData);

        localStorage.setItem('token', jwtToken);
        localStorage.setItem('user', JSON.stringify(userData));

        return userData;
    };

    const registerCentre = async (formData) => {
        const response = await api.post('/auth/register-centre', formData);
        return response.data;
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    const updateUserState = (updatedFields) => {
        setUser(prev => {
            const newObj = { ...prev, ...updatedFields };
            localStorage.setItem('user', JSON.stringify(newObj));
            return newObj;
        });
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, registerParent, registerCentre, logout, updateUserState }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
