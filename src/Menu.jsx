import {
  Home,
  LayoutDashboard,
  Users,
  ScrollText,
  IndianRupee,
  ListOrdered,
  FilePlus,
  ChartColumnStacked,
  LayoutList
} from "lucide-react";


export const menuIcon={
  Home:Home,
  LayoutDashboard:LayoutDashboard,
  Users:Users,
  ScrollText:ScrollText,
  IndianRupee:IndianRupee,
  ListOrdered:ListOrdered,
  FilePlus:FilePlus,
  ChartColumnStacked:ChartColumnStacked,
  LayoutList:LayoutList,
}
const menuItems = [
    { 
      name: 'Dashboard',
      icon: 'LayoutDashboard',
      type: 'menu',
      path: '/dashboard'
    },
    { 
      name: 'Start Collection',
      icon: 'LayoutList',
      type: 'menu',
      path: '/collection'
    },
    { 
      name: 'Collection List',
      icon: 'ScrollText',
      type: 'menu',
      path: '/collection-list',
      alts: ['/edit-collection']
    },
    { 
      name: 'Customer',
      icon: 'Users',
      type: 'menu',
      path: '/customers',
      alts: ['/add-customer', '/edit-customer']
    },
    { 
      name: 'Rate',
      icon: 'IndianRupee',
      type: 'menu',
      path: '/rate'
    },
    { 
      name: 'Dairy Details',
      icon: 'Home',
      type: 'menu',
      path: '/dairy-details'
    },
    { 
      name: 'Billing',
      icon: 'ChartColumnStacked',
      type: 'menu',
      path: '/billing'
    },
  ];
export default menuItems