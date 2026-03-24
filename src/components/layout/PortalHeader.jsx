import { LogOut, Menu } from 'lucide-react';
import { appConfig } from '../../config/appConfig';
import { formatDate } from '../../utils/date';
import { Button } from '../common/Button';

export function PortalHeader({ coachNotifications, currentProfile, profiles, onProfileChange, onLogout, onToggleSidebar }) {
  return (
    <header className="portal-header">
      <div className="portal-header__left">
        <button className="icon-button portal-header__menu" onClick={onToggleSidebar} type="button">
          <Menu size={18} />
        </button>
        <div>
          <p className="portal-header__eyebrow">{appConfig.isDemoMode ? 'Demo mode' : 'Live mode'}</p>
          <h1>{currentProfile?.role === 'coach' ? 'Coach workspace' : `${currentProfile?.name} portal`}</h1>
        </div>
      </div>

      <div className="portal-header__right">
        <div className="portal-header__date">{formatDate(new Date(), { weekday: 'short', month: 'short', day: 'numeric' })}</div>
        {appConfig.isDemoMode ? (
          <label className="select-shell portal-header__switcher">
            <span>Switch demo user</span>
            <select value={currentProfile?.id || ''} onChange={(event) => onProfileChange(event.target.value)}>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {coachNotifications}
        <Button tone="neutral" variant="outline" size="sm" onClick={onLogout}>
          <LogOut size={16} />
          Log out
        </Button>
      </div>
    </header>
  );
}
