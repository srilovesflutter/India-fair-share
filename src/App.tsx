import { HashRouter, Route, Routes } from "react-router-dom";
import { Chrome } from "./components/Chrome";
import { CompanyPage } from "./pages/CompanyPage";
import { HomePage } from "./pages/Home";
import { MethodologyPage } from "./pages/Methodology";

export default function App() {
  return (
    <HashRouter>
      <Chrome>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/company/:id" element={<CompanyPage />} />
          <Route path="/methodology" element={<MethodologyPage />} />
          <Route
            path="*"
            element={
              <div className="panel empty">
                <h2>Page not found</h2>
                <p>That route is not part of Fair Share.</p>
              </div>
            }
          />
        </Routes>
      </Chrome>
    </HashRouter>
  );
}
