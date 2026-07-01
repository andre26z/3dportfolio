import { NavLink } from "react-router-dom";
import { projects } from "../projects";

// Your name — shown at the left of the navbar.
export const OWNER_NAME = "Andre Santos";

const bar: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "18px 28px",
  zIndex: 20,
  pointerEvents: "none", // let clicks fall through except on links
};

const name: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 20,
  letterSpacing: "0.02em",
  color: "#e9eaff",
  textDecoration: "none",
  pointerEvents: "auto",
  textShadow: "0 2px 12px rgba(0,0,0,0.6)",
};

const links: React.CSSProperties = {
  display: "flex",
  gap: 22,
  pointerEvents: "auto",
};

function linkStyle({ isActive }: { isActive: boolean }): React.CSSProperties {
  return {
    color: isActive ? "#ff2e88" : "#c9cbe8",
    textDecoration: "none",
    fontSize: 15,
    fontWeight: 600,
    textShadow: "0 2px 12px rgba(0,0,0,0.6)",
    transition: "color 0.2s",
  };
}

export function Navbar() {
  return (
    <nav style={bar}>
      <NavLink to="/" style={name}>
        {OWNER_NAME}
      </NavLink>
      <div style={links}>
        {projects.map((p) => (
          <NavLink
            key={p.slug}
            to={p.slug === "" ? "/" : `/projects/${p.slug}`}
            end
            style={linkStyle}
          >
            {p.nav}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
