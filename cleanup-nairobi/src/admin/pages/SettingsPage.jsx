import React, { useState } from "react";
import ProfileSettings from "../components/ProfileSettings";
import SystemSettings from "../components/SystemSettings";
import RolesPermissionsSettings from "../components/RolesPermissionsSettings";
import IntegrationsSettings from "../components/IntegrationsSettings";

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("profile");

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return <ProfileSettings />;
      case "system":
        return <SystemSettings />;
      case "roles":
        return <RolesPermissionsSettings />;
      case "integrations":
        return <IntegrationsSettings />;
      default:
        return null;
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Settings & Configuration
      </h1>
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-4 py-2 text-lg font-medium ${
            activeTab === "profile"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500"
          }`}
        >
          Profile Settings
        </button>
        <button
          onClick={() => setActiveTab("system")}
          className={`px-4 py-2 text-lg font-medium ${
            activeTab === "system"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500"
          }`}
        >
          System Settings
        </button>
        <button
          onClick={() => setActiveTab("roles")}
          className={`px-4 py-2 text-lg font-medium ${
            activeTab === "roles"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500"
          }`}
        >
          User Roles & Permissions
        </button>
        <button
          onClick={() => setActiveTab("integrations")}
          className={`px-4 py-2 text-lg font-medium ${
            activeTab === "integrations"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500"
          }`}
        >
          Integrations
        </button>
      </div>
      <div className="mt-6">{renderContent()}</div>
    </div>
  );
};

export default SettingsPage;
