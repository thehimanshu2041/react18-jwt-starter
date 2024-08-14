import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import restUtils from '../utils/restUtils';
import { Auth, AuthR } from '../model/auth.model';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { ELITE_TOKEN } from '../model/elite';


const CXT_PATH = process.env.REACT_APP_BASE_URL;

interface AuthContextProps {
    isAuthenticated: boolean;
    login: (payload: Auth) => Promise<boolean>;
    logout: () => void;
    token: string | null;
}

interface JwtPayload {
    exp: number;
    [key: string]: any;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('UseAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const tokenFromStorage = localStorage.getItem(ELITE_TOKEN);
    const [token, setToken] = useState<string | null>(tokenFromStorage || null);

    const login = async (payload: Auth) => {
        const response = await restUtils.call<string>(`${CXT_PATH}/auth/login`, 'POST', payload);
        if (response) {
            setToken(response);
            localStorage.setItem(ELITE_TOKEN, response);
            return true;
        }
        return false;
    };

    const logout = async () => {
        setToken(null);
        localStorage.removeItem(ELITE_TOKEN);
        delete axios.defaults.headers.common['Authorization'];
    };

    useEffect(() => {
        console.log('useEffect');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
    }, [token]);

    const isTokenValid = (token: string | null): boolean => {
        if (!token) {
            return false;
        }

        try {
            const decoded: JwtPayload = jwtDecode(token);
            const currentTime = Date.now() / 1000;
            if (decoded.exp < currentTime) {
                throw new Error('Token expired.');
            }
            return true;
        } catch (error) {
            logout();
            console.error('Token validation error : ', error);
            return false;
        }
    };

    const value = {
        isAuthenticated: isTokenValid(token),
        token,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
