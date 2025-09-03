import { useCallback, useEffect, useRef, useState  } from "react";
import { Link, useLocation } from "react-router";
import { Factory, WrenchScrewdriver } from 'lucide-react';
import maintenanceImg from "../../public/images/repairing-tool.png";
import failureImg from "../../public/images/disruption.png";
import machineImg from "../../public/images/machinelogo.png";
import Systemimg from "../../public/images/alerte (2).png";


// Assume these icons are imported from an icon library
import {
  BoxCubeIcon,
  CalenderIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  PageIcon,
  PieChartIcon,
  PlugInIcon,
  TableIcon,
  UserCircleIcon,
  
} from "../icons";
import { useSidebar } from "../context/SidebarContext";





type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean; roles?: string[] }[];
  roles?: string[]; // <-- NEW
};

const FailureIcon = (
  <img src={failureImg} alt="Maintenance" className="w-[30px] h-[28px]" />
);

const MaintenanceIcon = (
  <img src={maintenanceImg} alt="Maintenance" className="w-[30px] h-[28px]" />
);

const MachineManagementIcon = (
  <img src={machineImg} alt="Machine Management" className="w-[28px] h-[28px]" />
);

const SystemAlertIcon = (
  <img src={Systemimg} alt="Machine Management" className="w-[28px] h-[28px]" />
);


const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    subItems: [{ name: "Machine Dashboard", path: "/home", pro: false }],
  },
  {
    icon: <CalenderIcon />,
    name: "Calendar",
    path: "/calendar",
  },
{
    icon: MachineManagementIcon,
    name: "Machine Management",
    subItems: [
      { name: "Add new machine", path: "/addmachine", roles: ["EXECUTOR", "ADMIN", "MANAGER"] },
      { name: "Add new machine", path: "/addmachineviewer", roles: ["VIEWER"] },
      { name: "View machines", path: "/machinelist", roles: ["EXECUTOR", "MANAGER", "ADMIN"] },
      { name: "View machines", path: "/machineviewer", roles: ["VIEWER"] },
    ],
  }
  ,  
  {
    icon: MaintenanceIcon,
    name: "Maintenance",
    subItems: [
      { name: "Create Maintenance Task", path: "/addmaintenace", roles: ["EXECUTOR", "ADMIN", "MANAGER"] },
      { name: "Create Maintenance Task", path: "/addmaintenanceviewer", roles: ["VIEWER"] },
      { name: "View Maintenance Task", path: "/maintenanceviewer", roles: ["VIEWER"] },
      { name: "View Maintenance Task", path: "/maintenancedetails", roles: ["ADMIN", "MANAGER", "EXECUTOR"] },
      { name: "My Tasks & Responses", path: "/executorrequest", roles: ["EXECUTOR", "MANAGER","ADMIN"] },
      { name: "Pending Validations", path: "/manager/reviews", roles: ["MANAGER", "EXECUTOR", "ADMIN"] },
    ],
  },
  
 {
    icon: FailureIcon,
    name: "Failure",
    subItems: [
      { name: "Create Failure Record", path: "/addfailure", roles: ["EXECUTOR", "ADMIN", "MANAGER"] },
      { name: "Create Failure Record", path: "/addfailureviewer", roles: ["VIEWER"] },
      { name: "View Failure Record", path: "/addfailure", roles: ["VIEWER"] },
      { name: "View Failure Record", path: "/failuredetails", roles: ["ADMIN", "MANAGER", "EXECUTOR"] }
    ],
  },

   {
    icon: SystemAlertIcon,
    name: "System Alerts",
    subItems: [
  
    ],
  },
];

const othersItems: NavItem[] = [
  {
    icon: <PieChartIcon />,
    name: "Charts",
    subItems: [
      { name: "Line Chart", path: "/line-chart", pro: false },
      { name: "Bar Chart", path: "/bar-chart", pro: false },
    ],
  },
  {
    icon: <BoxCubeIcon />,
    name: "UI Elements",
    subItems: [
      { name: "Alerts", path: "/alerts", pro: false },
      { name: "Avatar", path: "/avatars", pro: false },
      { name: "Badge", path: "/badge", pro: false },
      { name: "Buttons", path: "/buttons", pro: false },
      { name: "Images", path: "/images", pro: false },
      { name: "Videos", path: "/videos", pro: false },
    ],
  }
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
const role = localStorage.getItem('role');

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // const isActive = (path: string) => location.pathname === path;
  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name} className={nav.name === "System Alerts" ? "mt-70" : ""}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={`menu-item-icon-size  ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`menu-item-icon-size ${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}
   {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
  <div
    ref={(el) => {
      subMenuRefs.current[`${menuType}-${index}`] = el;
    }}
    className="overflow-hidden transition-all duration-300"
    style={{
      height:
        openSubmenu?.type === menuType && openSubmenu?.index === index
          ? `${subMenuHeight[`${menuType}-${index}`]}px`
          : "0px",
    }}
  >
    <ul className="mt-2 space-y-1 ml-9">
      {nav.subItems
        .filter((subItem) => {
          // Render if no roles specified or if current user's role matches
          return !subItem.roles || subItem.roles.includes(role);
        })
        .map((subItem) => (
          <li key={subItem.name}>
            <Link
              to={subItem.path}
              className={`menu-dropdown-item ${
                isActive(subItem.path)
                  ? "menu-dropdown-item-active"
                  : "menu-dropdown-item-inactive"
              }`}
            >
              {subItem.name}
              <span className="flex items-center gap-1 ml-auto">
                {subItem.new && (
                  <span
                    className={`ml-auto ${
                      isActive(subItem.path)
                        ? "menu-dropdown-badge-active"
                        : "menu-dropdown-badge-inactive"
                    } menu-dropdown-badge`}
                  >
                    new
                  </span>
                )}
                {subItem.pro && (
                  <span
                    className={`ml-auto ${
                      isActive(subItem.path)
                        ? "menu-dropdown-badge-active"
                        : "menu-dropdown-badge-inactive"
                    } menu-dropdown-badge`}
                  >
                    pro
                  </span>
                )}
              </span>
            </Link>
          </li>
        ))}
    </ul>
  </div>
)}

        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img
                className="dark:hidden"
                src="/images/b3a6f87f-d0dd-4c2f-8f5f-5a6c049a8916.png"
                alt="Logo"
                width={90}
                height={10}
              />
              <img
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                width={150}
                height={40}
              />
            </>
          ) : (
            <img
              src="/images/logo/logo-icon.svg"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>
            
          </div>
        </nav>
     
      </div>
    </aside>
  );
};

export default AppSidebar;
