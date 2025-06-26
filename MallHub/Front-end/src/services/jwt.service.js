import { jwtDecode } from 'jwt-decode';
import axios from './axios';



class JwtTokenService  {
    init() {
    }

    async Refresh() {
        const { data } = await axios.post("jwt/Refresh", this.GetTokens());
        this.SetSession({ ...data, ...data.portal });
        return [data.token, data.refreshToken];
    }

    async ValidateToken() {
        return await axios.get('jwt/ValidateToken');
    }

    DecodeToken() {
        const { token } = this.GetTokens();
        const result = jwtDecode(token);

        return {
            ...result,
            id: +result.id
        };
    }

    GetTokens() {
        return {
            refresh: localStorage.getItem('refresh_token'),
            access: localStorage.getItem('access_token'),
        }
    }

    // SetSession(input?: { token: string, refreshToken: string, portalToken: string, absoluteUrl: string, applicationName: string, hostName: string } | undefined) {
    //     if (input === undefined) {
    //         localStorage.removeItem('refreshToken');
    //         localStorage.removeItem('FMS_Visualization_Token');
    //         localStorage.removeItem('portalToken');
    //         return;
    //     }
    //     localStorage.setItem('refreshToken', input!.refreshToken!);
    //     localStorage.setItem('FMS_Visualization_Token', input!.token!);
    //     localStorage.setItem('absoluteUrl', input.absoluteUrl);
    //     localStorage.setItem('applicationName', input.applicationName);
    //     localStorage.setItem('hostName', input.hostName);
    //     localStorage.setItem('portalToken', input.portalToken);
    //     this.emit(FMSEvents.onLogin);
    // }

    IsUnauthorizedError(error) {
        const { response: { status } } = error;
        return status === 401;
    }

    // Logout() {
    //     this.SetSession();
    //     this.emit(FMSEvents.onLogout);
    // }

    // HandleAuthentication = async () => {
    //     const tokens = this.GetTokens();

    //     if (!tokens?.token) {
    //         return;
    //     }

    //     this.emit(FMSEvents.onLogin);

    //     if (this.IsAuthTokenValid(tokens.token)) {
    //         this.emit(FMSEvents.onLogin);
    //     } else {
    //         await this.ValidateToken();
    //     }
    // };

    IsAuthTokenValid = (access_token) => {
        if (!access_token) {
            return false;
        }
        const decoded = jwtDecode(access_token);
        const currentTime = Date.now() / 1000;
        if (decoded.exp < currentTime) {
            return false;
        }
        return true;
    };
}

const instance = new JwtTokenService();
export default instance;
