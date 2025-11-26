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
  MicrophoneIcon,
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
    { name: 'Voice Check-in', href: '/check-in', icon: MicrophoneIcon },
    { name: 'Insights', href: '/insights', icon: LightBulbIcon },
    { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
    { name: 'Search', href: '/search', icon: MagnifyingGlassIcon },
  ];

  const secondaryNavigation = [
    { name: 'Profile', href: '/profile', icon: UserIcon },
    { name: 'Settings', href: '/settings', icon: CogIcon },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      dispatch({ type: 'SET_USER', payload: null });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const NavItem = ({ item }: { item: any }) => {
    const isActive = router.pathname === item.href;

    return (
      <Link
        href={item.href}
        onClick={() => {
          if (mobile && onClose) {
            onClose();
          }
        }}
        className={`
          group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors
          ${isActive
            ? 'bg-primary-100 text-primary-900 dark:bg-primary-900 dark:text-primary-100'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
          }
        `}
      >
        <item.icon
          className={`
            mr-3 flex-shrink-0 h-5 w-5
            ${isActive
              ? 'text-primary-500 dark:text-primary-400'
              : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-300'
            }
          `}
          aria-hidden="true"
        />
        {item.name}
      </Link>
    );
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Logo */}
      <div className="flex items-center flex-shrink-0 px-4">
        <Link href="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <MicrophoneIcon className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            Mood Journal
          </span>
        </Link>
      </div>

      {/* Main Navigation */}
      <div className="mt-8 flex-1 px-2 space-y-1">
        {navigation.map((item) => (
          <NavItem key={item.name} item={item} />
        ))}
      </div>

      {/* Secondary Navigation */}
      <div className="px-2 space-y-1 border-t border-gray-200 dark:border-gray-700 pt-4">
        {secondaryNavigation.map((item) => (
          <NavItem key={item.name} item={item} />
        ))}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="
            group flex items-center px-2 py-2 text-sm font-medium rounded-md
            text-red-600 hover:bg-red-50 hover:text-red-900 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300
            transition-colors w-full
          "
        >
          <ArrowRightOnRectangleIcon
            className="mr-3 flex-shrink-0 h-5 w-5 text-red-400 group-hover:text-red-500 dark:text-red-500"
            aria-hidden="true"
          />
          Logout
        </button>
      </div>

      {/* User Info */}
      {state.user && (
        <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
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