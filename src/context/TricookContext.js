import React, {createContext, useContext, useReducer} from 'react';

const generateId = () => Math.random().toString(36).substring(2, 9);

const initialState = {
  members: [],
  menus: [],
  breakfast: [],
  apero: [],
  common: []
};

function reducer(state, action) {
  switch (action.type) {
    case 'CREATE_INSTANCE':
      return {...initialState, members: [action.owner]};
    case 'INVITE_MEMBER':
      return {...state, members: [...state.members, action.email]};
    case 'LEAVE_INSTANCE':
      return {...state, members: state.members.filter(m => m !== action.email)};
    case 'ADD_MENU':
      return {...state, menus: [...state.menus, {id: generateId(), name: action.name, members: [], items: []}]};
    case 'REMOVE_MENU':
      return {...state, menus: state.menus.filter(m => m.id !== action.id)};
    case 'JOIN_MENU':
      return {
        ...state,
        menus: state.menus.map(m =>
          m.id === action.id ? {...m, members: [...new Set([...m.members, action.email])]} : m
        )
      };
    case 'LEAVE_MENU':
      return {
        ...state,
        menus: state.menus.map(m =>
          m.id === action.id ? {...m, members: m.members.filter(e => e !== action.email)} : m
        )
      };
    case 'ADD_MENU_ITEM':
      return {
        ...state,
        menus: state.menus.map(m =>
          m.id === action.id ? {...m, items: [...m.items, {...action.item, id: generateId()}]} : m
        )
      };
    case 'UPDATE_MENU_ITEM':
      return {
        ...state,
        menus: state.menus.map(m =>
          m.id === action.menuId
            ? {...m, items: m.items.map(i => (i.id === action.itemId ? {...i, ...action.updates} : i))}
            : m
        )
      };
    case 'REMOVE_MENU_ITEM':
      return {
        ...state,
        menus: state.menus.map(m =>
          m.id === action.menuId
            ? {...m, items: m.items.filter(i => i.id !== action.itemId)}
            : m
        )
      };
    case 'ADD_ITEM':
      return {
        ...state,
        [action.category]: [...state[action.category], {...action.item, id: generateId()}]
      };
    case 'UPDATE_ITEM':
      return {
        ...state,
        [action.category]: state[action.category].map(i =>
          i.id === action.itemId ? {...i, ...action.updates} : i
        )
      };
    case 'REMOVE_ITEM':
      return {
        ...state,
        [action.category]: state[action.category].filter(i => i.id !== action.itemId)
      };
    default:
      return state;
  }
}

const TricookContext = createContext();

export const TricookProvider = ({children, preconfiguredItems = []}) => {
  const [state, dispatch] = useReducer(reducer, {...initialState, preconfiguredItems});

  const createInstance = owner => dispatch({type: 'CREATE_INSTANCE', owner});
  const inviteMember = email => dispatch({type: 'INVITE_MEMBER', email});
  const leaveInstance = email => dispatch({type: 'LEAVE_INSTANCE', email});
  const addMenu = name => dispatch({type: 'ADD_MENU', name});
  const removeMenu = id => dispatch({type: 'REMOVE_MENU', id});
  const joinMenu = (id, email) => dispatch({type: 'JOIN_MENU', id, email});
  const leaveMenu = (id, email) => dispatch({type: 'LEAVE_MENU', id, email});
  const addMenuItem = (id, item) => dispatch({type: 'ADD_MENU_ITEM', id, item});
  const updateMenuItem = (menuId, itemId, updates) => dispatch({type: 'UPDATE_MENU_ITEM', menuId, itemId, updates});
  const removeMenuItem = (menuId, itemId) => dispatch({type: 'REMOVE_MENU_ITEM', menuId, itemId});
  const addItem = (category, item) => dispatch({type: 'ADD_ITEM', category, item});
  const updateItem = (category, itemId, updates) => dispatch({type: 'UPDATE_ITEM', category, itemId, updates});
  const removeItem = (category, itemId) => dispatch({type: 'REMOVE_ITEM', category, itemId});

  return (
    <TricookContext.Provider
      value={{state, createInstance, inviteMember, leaveInstance, addMenu, removeMenu, joinMenu, leaveMenu, addMenuItem, updateMenuItem, removeMenuItem, addItem, updateItem, removeItem}}
    >
      {children}
    </TricookContext.Provider>
  );
};

export const useTricook = () => useContext(TricookContext);
