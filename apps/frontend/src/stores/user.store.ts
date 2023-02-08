import type { PayloadAction, Dispatch } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import { apiLogin, apiLogout } from '../api/user.api';
import type { LoginParams, Role } from '../types/user/login';
import type { Locale, UserState } from '../types/user/user';
import { createAsyncAction } from './utils';
import { getGlobalState } from '../utils/getGloabal';

const initialState: UserState = {
  ...getGlobalState(),
  noticeCount: 0,
  locale: (localStorage.getItem('locale')! || 'zh_CN') as Locale,
  newUser: JSON.parse(localStorage.getItem('newUser')!) ?? true,
  logged: localStorage.getItem('t') ? true : false,
  menuList: [],
  username: localStorage.getItem('username') || '',
  role: (localStorage.getItem('username') || '') as Role,
  newUsername: '',
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserItem(state, action: PayloadAction<Partial<UserState>>) {
      const { username } = action.payload;

      if (username !== state.username) {
        localStorage.setItem('username', action.payload.username || '');
      }

      Object.assign(state, action.payload);
    },
    setUsername(state: any, action: any) {
      state.newUsername = action.payload;
    },
  },
});

export const { setUserItem, setUsername } = userSlice.actions;

export default userSlice.reducer;

// source async thunk
// export const loginAsync = (payload: LoginParams) => {
//   return async (dispatch: Dispatch) => {
//     const { result, status } = await apiLogin(payload);
//     if (status) {
//       localStorage.setItem('t', result.token);
//       localStorage.setItem('username', result.username);
//       dispatch(
//         setUserItem({
//           logged: true,
//           username: result.username
//         })
//       );
//       return true;
//     }
//     return false;
//   };
// };

// typed wrapper async thunk function demo, no extra feature, just for powerful typings
export const loginAsync = createAsyncAction<LoginParams, boolean>((payload) => {
  return async (dispatch) => {
    const { result, status } = await apiLogin(payload);
    if (status) {
      localStorage.setItem('t', result.token);
      localStorage.setItem('username', result.username);
      dispatch(
        setUserItem({
          logged: true,
          username: result.username,
        }),
      );
      return true;
    }
    return false;
  };
});

export const logoutAsync = () => {
  return async (dispatch: Dispatch) => {
    const { status } = await apiLogout({ token: localStorage.getItem('t')! });
    if (status) {
      localStorage.clear();
      dispatch(
        setUserItem({
          logged: false,
        }),
      );
      return true;
    }
    return false;
  };
};
