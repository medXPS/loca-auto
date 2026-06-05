import { Switch, Route, Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";

import { PublicLayout } from "@/components/layout/public-layout";
import { AdminLayout } from "@/components/layout/admin-layout";
import NotFound from "@/pages/not-found";

import Home from "@/pages/public/home";
import Cars from "@/pages/public/cars";
import CarDetail from "@/pages/public/car-detail";
import Blog from "@/pages/public/blog";
import BlogDetail from "@/pages/public/blog-detail";
import About from "@/pages/public/about";
import Contact from "@/pages/public/contact";
import Faq from "@/pages/public/faq";
import Legal from "@/pages/public/legal";
import Privacy from "@/pages/public/privacy";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";

import AdminDashboard from "@/pages/admin/dashboard";
import AdminCars from "@/pages/admin/cars/index";
import AdminNewCar from "@/pages/admin/cars/new";
import AdminEditCar from "@/pages/admin/cars/edit";
import AdminRequests from "@/pages/admin/requests/index";
import AdminRequestDetail from "@/pages/admin/requests/detail";
import AdminCustomers from "@/pages/admin/customers/index";
import AdminCustomerDetail from "@/pages/admin/customers/detail";
import AdminAgents from "@/pages/admin/agents/index";
import AdminNewAgent from "@/pages/admin/agents/new";
import AdminExpenses from "@/pages/admin/expenses/index";
import AdminBlog from "@/pages/admin/blog/index";
import AdminNewBlogPost from "@/pages/admin/blog/new";
import AdminSettings from "@/pages/admin/settings";
import AdminAuditLogs from "@/pages/admin/audit";

import CustomerDashboard from "@/pages/customer/dashboard";
import CustomerRequests from "@/pages/customer/requests/index";
import CustomerRequestDetail from "@/pages/customer/requests/detail";
import CustomerProfile from "@/pages/customer/profile";

function ProtectedRoute({ component: Component, allowedRoles }: { component: any, allowedRoles: string[] }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;

  if (!isAuthenticated) return <Redirect to="/connexion" />;

  if (user && !allowedRoles.includes(user.role)) {
    if (user.role === "SUPER_ADMIN") return <Redirect to="/admin" />;
    if (user.role === "AGENT") return <Redirect to="/agent" />;
    return <Redirect to="/dashboard" />;
  }

  return <Component />;
}

function AdminRoute({ component, allowedRoles }: { component: any; allowedRoles: string[] }) {
  return (
    <AdminLayout>
      <ProtectedRoute component={component} allowedRoles={allowedRoles} />
    </AdminLayout>
  );
}

function CustomerRoute({ component }: { component: any }) {
  return (
    <PublicLayout>
      <ProtectedRoute component={component} allowedRoles={["CUSTOMER"]} />
    </PublicLayout>
  );
}

export default function AppRouter() {
  return (
    <Switch>
      {/* Admin Routes */}
      <Route path="/admin" component={() => <AdminRoute component={AdminDashboard} allowedRoles={["SUPER_ADMIN"]} />} />
      <Route path="/admin/voitures/nouvelle" component={() => <AdminRoute component={AdminNewCar} allowedRoles={["SUPER_ADMIN"]} />} />
      <Route path="/admin/voitures/:id" component={() => <AdminRoute component={AdminEditCar} allowedRoles={["SUPER_ADMIN"]} />} />
      <Route path="/admin/voitures" component={() => <AdminRoute component={AdminCars} allowedRoles={["SUPER_ADMIN"]} />} />
      <Route path="/admin/demandes/:id" component={() => <AdminRoute component={AdminRequestDetail} allowedRoles={["SUPER_ADMIN"]} />} />
      <Route path="/admin/demandes" component={() => <AdminRoute component={AdminRequests} allowedRoles={["SUPER_ADMIN"]} />} />
      <Route path="/admin/clients/:id" component={() => <AdminRoute component={AdminCustomerDetail} allowedRoles={["SUPER_ADMIN"]} />} />
      <Route path="/admin/clients" component={() => <AdminRoute component={AdminCustomers} allowedRoles={["SUPER_ADMIN"]} />} />
      <Route path="/admin/agents/nouveau" component={() => <AdminRoute component={AdminNewAgent} allowedRoles={["SUPER_ADMIN"]} />} />
      <Route path="/admin/agents" component={() => <AdminRoute component={AdminAgents} allowedRoles={["SUPER_ADMIN"]} />} />
      <Route path="/admin/charges" component={() => <AdminRoute component={AdminExpenses} allowedRoles={["SUPER_ADMIN"]} />} />
      <Route path="/admin/blog/nouveau" component={() => <AdminRoute component={AdminNewBlogPost} allowedRoles={["SUPER_ADMIN"]} />} />
      <Route path="/admin/blog" component={() => <AdminRoute component={AdminBlog} allowedRoles={["SUPER_ADMIN"]} />} />
      <Route path="/admin/parametres" component={() => <AdminRoute component={AdminSettings} allowedRoles={["SUPER_ADMIN"]} />} />
      <Route path="/admin/audit" component={() => <AdminRoute component={AdminAuditLogs} allowedRoles={["SUPER_ADMIN"]} />} />

      {/* Agent Routes */}
      <Route path="/agent" component={() => <AdminRoute component={AdminDashboard} allowedRoles={["AGENT"]} />} />
      <Route path="/agent/voitures/nouvelle" component={() => <AdminRoute component={AdminNewCar} allowedRoles={["AGENT"]} />} />
      <Route path="/agent/voitures/:id" component={() => <AdminRoute component={AdminEditCar} allowedRoles={["AGENT"]} />} />
      <Route path="/agent/voitures" component={() => <AdminRoute component={AdminCars} allowedRoles={["AGENT"]} />} />
      <Route path="/agent/demandes/:id" component={() => <AdminRoute component={AdminRequestDetail} allowedRoles={["AGENT"]} />} />
      <Route path="/agent/demandes" component={() => <AdminRoute component={AdminRequests} allowedRoles={["AGENT"]} />} />
      <Route path="/agent/clients/:id" component={() => <AdminRoute component={AdminCustomerDetail} allowedRoles={["AGENT"]} />} />
      <Route path="/agent/clients" component={() => <AdminRoute component={AdminCustomers} allowedRoles={["AGENT"]} />} />
      <Route path="/agent/charges" component={() => <AdminRoute component={AdminExpenses} allowedRoles={["AGENT"]} />} />

      {/* Customer Routes */}
      <Route path="/dashboard" component={() => <CustomerRoute component={CustomerDashboard} />} />
      <Route path="/dashboard/demandes/:id" component={() => <CustomerRoute component={CustomerRequestDetail} />} />
      <Route path="/dashboard/demandes" component={() => <CustomerRoute component={CustomerRequests} />} />
      <Route path="/dashboard/profil" component={() => <CustomerRoute component={CustomerProfile} />} />

      {/* Public Routes */}
      <Route path="/" component={() => <PublicLayout><Home /></PublicLayout>} />
      <Route path="/voitures" component={() => <PublicLayout><Cars /></PublicLayout>} />
      <Route path="/voitures/:id" component={() => <PublicLayout><CarDetail /></PublicLayout>} />
      <Route path="/blog" component={() => <PublicLayout><Blog /></PublicLayout>} />
      <Route path="/blog/:slug" component={() => <PublicLayout><BlogDetail /></PublicLayout>} />
      <Route path="/a-propos" component={() => <PublicLayout><About /></PublicLayout>} />
      <Route path="/contact" component={() => <PublicLayout><Contact /></PublicLayout>} />
      <Route path="/faq" component={() => <PublicLayout><Faq /></PublicLayout>} />
      <Route path="/mentions-legales" component={() => <PublicLayout><Legal /></PublicLayout>} />
      <Route path="/confidentialite" component={() => <PublicLayout><Privacy /></PublicLayout>} />
      <Route path="/connexion" component={() => <PublicLayout><Login /></PublicLayout>} />
      <Route path="/inscription" component={() => <PublicLayout><Register /></PublicLayout>} />

      {/* 404 */}
      <Route component={() => <PublicLayout><NotFound /></PublicLayout>} />
    </Switch>
  );
}
