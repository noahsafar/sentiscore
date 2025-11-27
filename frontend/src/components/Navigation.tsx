import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAppContext } from '@/store/AppContext';
import {
  HomeIcon,
  CalendarIcon,
  ChartBarIcon,
  CogIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  LightBulbIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

interface NavigationProps {
  mobile?: boolean;
  onClose?: () => void;
}

export default function Navigation({ mobile = false, onClose }: NavigationProps) {
  const router = useRouter();
  const { state, dispatch } = useAppContext();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Journal', href: '/entries', icon: CalendarIcon },
    { name: 'Insights', href: '/insights', icon: LightBulbIcon },
    { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
    { name: 'Search', href: '/search', icon: MagnifyingGlassIcon },
    { name: 'Profile', href: '/profile', icon: UserIcon },
    { name: 'Settings', href: '/settings', icon: CogIcon },
  ];

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:8000/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      dispatch({ type: 'SET_USER', payload: null });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const logoutItem = { name: 'Logout', href: '#', icon: ArrowRightOnRectangleIcon, action: handleLogout };

  const NavItem = ({ item }: { item: any }) => {
    const isActive = router.pathname === item.href;

    const handleClick = () => {
      if (item.action) {
        item.action();
      }
      if (mobile && onClose) {
        onClose();
      }
    };

    const Component = item.action ? 'button' : Link;
    const props = item.action
      ? { onClick: handleClick }
      : { href: item.href, onClick: handleClick };

    return (
      <Component
        {...props}
        className={`
          group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors w-full text-left
          ${item.action
            ? 'text-red-600 hover:bg-red-50 hover:text-red-900 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300'
            : isActive
            ? 'bg-primary-100 text-primary-900 dark:bg-primary-900 dark:text-primary-100'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
          }
        `}
      >
        <item.icon
          className={`
            mr-3 flex-shrink-0 h-5 w-5
            ${item.action
              ? 'text-red-400 group-hover:text-red-500 dark:text-red-500'
              : isActive
              ? 'text-primary-500 dark:text-primary-400'
              : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-300'
            }
          `}
          aria-hidden="true"
        />
        {item.name}
      </Component>
    );
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Logo */}
      <div className="flex items-center flex-shrink-0 px-4">
        <Link href="/" className="flex items-center space-x-3">
          <div className="relative">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-cyan-400 rounded-full animate-pulse"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent">
              SentiScore
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
              Track your emotional journey
            </span>
          </div>
        </Link>
      </div>

      {/* Main Navigation */}
      <div className="mt-8 flex-1 px-2 space-y-1">
        {[...navigation, logoutItem].map((item) => (
          <NavItem key={item.name} item={item} />
        ))}
      </div>

      {/* User Info */}
      {state.user && (
        <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 pt-8 px-4 pb-8">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {state.user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {state.user.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {state.user.email}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}