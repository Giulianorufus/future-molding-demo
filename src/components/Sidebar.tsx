import { NavLink } from "react-router-dom";
import {
  AlertTriangle, ClipboardList, Database, FileText, GraduationCap,
  LayoutDashboard, Settings, Wrench,
} from "lucide-react";

const navigation = [
  { to: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/disegni", label: "Disegni", Icon: FileText },
  { to: "/wizard", label: "Configura stampata", Icon: Wrench },
  { to: "/parametri", label: "Parametri", Icon: ClipboardList },
  { to: "/difetti", label: "Difetti", Icon: AlertTriangle },
  { to: "/raccolta-dati", label: "Raccolta Dati", Icon: Database },
  { to: "/academy", label: "Academy", Icon: GraduationCap },
  { to: "/impostazioni", label: "Impostazioni", Icon: Settings },
];

export default function Sidebar() {
  return (
    <nav aria-label="Navigazione principale" className="fm-sidebar flex w-full shrink-0 overflow-auto md:w-52 md:flex-col md:py-3">
      {navigation.map(({ to, label, Icon }) => (
        <NavLink key={to} to={to} className="fm-nav-link flex shrink-0 items-center gap-3 whitespace-nowrap px-4 py-3 text-sm font-semibold">
          <Icon size={18} aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
