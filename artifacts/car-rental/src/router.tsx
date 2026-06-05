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

export default function AppRouter() {
  return (
    <Switch>
      {/* Admin Routes */}
      <Route path="/admin*">
        <AdminLayout>
          <Switch>
            <Route path="/admin" component={() => <ProtectedRoute component={AdminDashboard} allowedRoles={["SUPER_ADMIN"]} />} />
            <Route path="/admin/voitures" component={() => <ProtectedRoute component={AdminCars} allowedRoles={["SUPER_ADMIN"]} />} />
            <Route path="/admin/voitures/nouvelle" component={() => <ProtectedRoute component={AdminNewCar} allowedRoles={["SUPER_ADMIN"]} />} />
            <Route path="/admin/voitures/:id" component={() => <ProtectedRoute component={AdminEditCar} allowedRoles={["SUPER_ADMIN"]} />} />
            <Route path="/admin/demandes" component={() => <ProtectedRoute component={AdminRequests} allowedRoles={["SUPER_ADMIN"]} />} />
            <Route path="/admin/demandes/:id" component={() => <ProtectedRoute component={AdminRequestDetail} allowedRoles={["SUPER_ADMIN"]} />} />
            <Route path="/admin/clients" component={() => <ProtectedRoute component={AdminCustomers} allowedRoles={["SUPER_ADMIN"]} />} />
            <Route path="/admin/clients/:id" component={() => <ProtectedRoute component={AdminCustomerDetail} allowedRoles={["SUPER_ADMIN"]} />} />
            <Route path="/admin/agents" component={() => <ProtectedRoute component={AdminAgents} allowedRoles={["SUPER_ADMIN"]} />} />
            <Route path="/admin/agents/nouveau" component={() => <ProtectedRoute component={AdminNewAgent} allowedRoles={["SUPER_ADMIN"]} />} />
            <Route path="/admin/charges" component={() => <ProtectedRoute component={AdminExpenses} allowedRoles={["SUPER_ADMIN"]} />} />
            <Route path="/admin/blog" component={() => <ProtectedRoute component={AdminBlog} allowedRoles={["SUPER_ADMIN"]} />} />
            <Route path="/admin/blog/nouveau" component={() => <ProtectedRoute component={AdminNewBlogPost} allowedRoles={["SUPER_ADMIN"]} />} />
            <Route path="/admin/parametres" component={() => <ProtectedRoute component={AdminSettings} allowedRoles={["SUPER_ADMIN"]} />} />
            <Route path="/admin/audit" component={() => <ProtectedRoute component={AdminAuditLogs} allowedRoles={["SUPER_ADMIN"]} />} />
            <Route component={NotFound} />
          </Switch>
        </AdminLayout>
      </Route>

      {/* Agent Routes */}
      <Route path="/agent*">
        <AdminLayout>
          <Switch>
            <Route path="/agent" component={() => <ProtectedRoute component={AdminDashboard} allowedRoles={["AGENT"]} />} />
            <Route path="/agent/voitures" component={() => <ProtectedRoute component={AdminCars} allowedRoles={["AGENT"]} />} />
            <Route path="/agent/voitures/nouvelle" component={() => <ProtectedRoute component={AdminNewCar} allowedRoles={["AGENT"]} />} />
            <Route path="/agent/voitures/:id" component={() => <ProtectedRoute component={AdminEditCar} allowedRoles={["AGENT"]} />} />
            <Route path="/agent/demandes" component={() => <ProtectedRoute component={AdminRequests} allowedRoles={["AGENT"]} />} />
            <Route path="/agent/demandes/:id" component={() => <ProtectedRoute component={AdminRequestDetail} allowedRoles={["AGENT"]} />} />
            <Route path="/agent/clients" component={() => <ProtectedRoute component={AdminCustomers} allowedRoles={["AGENT"]} />} />
            <Route path="/agent/charges" component={() => <ProtectedRoute component={AdminExpenses} allowedRoles={["AGENT"]} />} />
            <Route component={NotFound} />
          </Switch>
        </AdminLayout>
      </Route>

      {/* Customer Routes */}
      <Route path="/dashboard*">
        <PublicLayout>
          <Switch>
            <Route path="/dashboard" component={() => <ProtectedRoute component={CustomerDashboard} allowedRoles={["CUSTOMER"]} />} />
            <Route path="/dashboard/demandes" component={() => <ProtectedRoute component={CustomerRequests} allowedRoles={["CUSTOMER"]} />} />
            <Route path="/dashboard/demandes/:id" component={() => <ProtectedRoute component={CustomerRequestDetail} allowedRoles={["CUSTOMER"]} />} />
            <Route path="/dashboard/profil" component={() => <ProtectedRoute component={CustomerProfile} allowedRoles={["CUSTOMER"]} />} />
            <Route component={NotFound} />
          </Switch>
        </PublicLayout>
      </Route>

      {/* Public Routes */}
      <Route>
        <PublicLayout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/voitures" component={Cars} />
            <Route path="/voitures/:id" component={CarDetail} />
            <Route path="/blog" component={Blog} />
            <Route path="/blog/:slug" component={BlogDetail} />
            <Route path="/a-propos" component={About} />
            <Route path="/contact" component={Contact} />
            <Route path="/faq" component={Faq} />
            <Route path="/mentions-legales" component={Legal} />
            <Route path="/confidentialite" component={Privacy} />
            <Route path="/connexion" component={Login} />
            <Route path="/inscription" component={Register} />
            <Route component={NotFound} />
          </Switch>
        </PublicLayout>
      </Route>
    </Switch>
  );
}
