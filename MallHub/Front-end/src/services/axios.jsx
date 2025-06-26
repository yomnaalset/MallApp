import axios from "axios";
import JwtTokenService from './jwt.service';

let refreshingFunc = undefined;

const instance = axios.create({
    baseURL: 'http://localhost:8000'
});

instance.interceptors.request.use(function (config) {
    const {  access } = JwtTokenService.GetTokens();
    if (access)
        config.headers.Authorization = access ? `Bearer ${access}` : '';
    return config;
});

// instance.interceptors.response.use(
//   originalResponse => {
//     return originalResponse;
//   },
//     async (error) => {
//         const originalConfig = error.config;
//       const { token } = JwtTokenService.GetTokens();

//       if (!token || !JwtTokenService.IsUnauthorizedError(error))
//           return Promise.reject(error);


        
//       // Refresh Token API returns 401
//     //   if (JwtTokenService.IsUnauthorizedError(error) && originalConfig.url === 'jwt/Refresh') {
//     //       refreshingFunc = undefined;
//     //       window.location.assign((window.baseUrl === '/' ? '' : window.baseUrl) + "/session-time-out");
//     //       // JwtTokenService.Logout();
//     //       return Promise.reject(error);
//     //   }
          
//       if (!refreshingFunc)
//           refreshingFunc = JwtTokenService.Refresh();

//       let [newToken, _] = await refreshingFunc;
//       originalConfig.headers.Authorization = `Bearer ${newToken}`;

//       try {
//           return await axios.request(originalConfig);
//       } catch (innerError) {
//           if (JwtTokenService.IsUnauthorizedError(innerError))
//               throw innerError;
          
//       } finally {
//           refreshingFunc = undefined;
//       }

//       return Promise.reject(error);
//   }
// );



export default instance;