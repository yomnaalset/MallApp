import { LOCAL_STORAGE } from "@/lib/constants";
import { jwtDecode } from "jwt-decode";
import { createContext, useContext, useEffect, useState } from 'react';


const userDefaultValues = {
    role: '',
    name: '',
}

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [{ role, name }, setUserInfo] = useState(userDefaultValues)

    useEffect(() => {
        const access = localStorage.getItem(LOCAL_STORAGE.ACCESS_TOKEN)
        const refresh = localStorage.getItem(LOCAL_STORAGE.REFRESH_TOKEN)
        createSession({ access, refresh })
        setIsLoading(false);
    }, []);

    const login = ({ access, refresh }) => {
        createSession({ access, refresh })
        setIsLoading(false)
    };

    const logout = () => {
        clearSession();
    };

    const createSession = ({ access, refresh }) => {
        if (!access) return;
        if (!access) {
            clearSession();
            return;
        }
        const decoded = jwtDecode(access);
        const currentTime = Date.now() / 1000;

        if (decoded.exp < currentTime) {
            clearSession();
            return;
        }
        setUserInfo({
            role: decoded.role,
            name: decoded.name
        });

        localStorage.setItem(LOCAL_STORAGE.ROLE, decoded.role)
        localStorage.setItem(LOCAL_STORAGE.ACCESS_TOKEN, access);
        localStorage.setItem(LOCAL_STORAGE.REFRESH_TOKEN, refresh);
        localStorage.setItem(LOCAL_STORAGE.NAME, decoded.name);
        setIsAuthenticated(true);
    }

    const clearSession = () => {
        const access = localStorage.getItem(LOCAL_STORAGE.ACCESS_TOKEN)
        if (!access) return;
        localStorage.clear();
        setIsAuthenticated(false)
        setUserInfo(userDefaultValues)
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout, role, name }}>
            {!isLoading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
