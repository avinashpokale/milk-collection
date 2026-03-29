import React, { useEffect, useState } from 'react';
import { Sidebar, Menu, MenuItem, SubMenu } from "react-pro-sidebar";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import menuItems, { menuIcon } from '../Menu';
import { LogOut, TextAlignJustify } from "lucide-react";
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

const SidebarComponent = ({ toggled, setToggled }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [openMenuId, setOpenMenuId] = useState(null);
  const [collapsed, setCollapsed] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setCollapsed(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleToggleSubMenu = (menuId) => {
    setOpenMenuId(openMenuId === menuId ? null : menuId);
  };

  // UPDATED: Logic to check if main path OR any sub-route (alts) is active
  const checkActive = (item) => {
    const currentPath = location.pathname;
    if (currentPath === item.path) return true;
    if (item.alts && item.alts.some(alt => currentPath.startsWith(alt))) return true;
    return false;
  };

  const handleItemClick = () => {
    if (window.innerWidth < 768) {
      setToggled(false);
    }
  };

  const menuItemStyles = {
    button: ({ active }) => ({
      backgroundColor: active ? '#2563eb' : 'transparent',
      color: active ? '#ffffff' : '#a1a1aa',
      fontSize: '11px',
      fontWeight: '900',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      borderRadius: '12px',
      margin: '4px 10px',
      transition: 'all 0.3s ease',
      '&:hover': {
        backgroundColor: active ? '#2563eb' : '#18181b',
        color: '#ffffff',
      },
    }),
    icon: ({ active }) => ({
      color: active ? '#ffffff' : '#3b82f6',
    }),
    label: {
      fontWeight: 900,
    },
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <Sidebar
      backgroundColor="#09090b"
      rootStyles={{
        height: "100vh",
        borderRight: "1px solid #18181b",
        color: "#f4f4f5"
      }}
      className="no-print"
      collapsed={toggled ? false : collapsed}
      toggled={toggled}
      breakPoint="sm"
      onBackdropClick={() => setToggled(false)}
    >
      <Menu menuItemStyles={menuItemStyles}>
        <MenuItem 
          className="mb-10 mt-4"
          icon={<TextAlignJustify size={20} className="text-white" />}
          onClick={() => setCollapsed(!collapsed)}
        >
          <h2 className="text-white text-lg font-black italic tracking-tighter">
            DAIRY <span className="text-blue-500">PRO</span>
          </h2>
        </MenuItem>

        {menuItems.map((item) => {
          const MenuIconComponent = menuIcon[item.icon];
          
          if (item.type === 'menu') {
            return (
              <MenuItem
                key={item.path}
                active={checkActive(item)} // Now uses the new logic
                icon={<MenuIconComponent size={18} />}
                component={<Link to={item.path} />}
                onClick={handleItemClick}
              >
                {item.name}
              </MenuItem>
            );
          }

          // SUBMENU LOGIC
          const isSubActive = item.children?.some(child => checkActive(child));
          return (
            <SubMenu
              key={item.name}
              label={item.name}
              icon={<MenuIconComponent size={18} />}
              active={isSubActive}
              open={openMenuId === item.name}
              onOpenChange={() => handleToggleSubMenu(item.name)}
            >
              {item.children.map((child) => {
                const ChildIcon = menuIcon[child.icon];
                return (
                  <MenuItem
                    key={child.path}
                    active={checkActive(child)}
                    icon={<ChildIcon size={16} />}
                    component={<Link to={child.path} />}
                    style={{ backgroundColor: '#09090b' }}
                    onClick={handleItemClick}
                  >
                    {child.name}
                  </MenuItem>
                );
              })}
            </SubMenu>
          );
        })}

        <div className="mt-10 pt-4 border-t border-zinc-900">
          <MenuItem 
            icon={<LogOut size={18} />}
            rootStyles={{ color: '#ef4444' }}
            onClick={handleLogout}
          >
            LOGOUT
          </MenuItem>
        </div>
      </Menu>
    </Sidebar>
  );
};

export default SidebarComponent;