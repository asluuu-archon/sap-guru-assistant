import { Bell, HelpCircle, Search } from "lucide-react";

export function Topbar() {
  return (
    <header>
      <div className="search">
        <Search size={16} />
        <input placeholder="Search anything..." />
      </div>

      <Bell size={18} />
      <HelpCircle size={18} />

      <div className="avatar small">
        A
      </div>
    </header>
  );
}