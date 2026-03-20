
import React from 'react';
import { Edit, Trash2 } from 'lucide-react';

const RolesPermissionsSettings = () => {
  const roles = [
    { name: 'Super Admin', description: 'Has all permissions', userCount: 1 },
    { name: 'Manager', description: 'Manages collections and reports', userCount: 3 },
    { name: 'Operator', description: 'Conducts waste collection', userCount: 12 },
    { name: 'Citizen', description: 'Reports waste and participates in events', userCount: 150 },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">User Roles & Permissions</h3>
        <button className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600">
          Create Custom Role
        </button>
      </div>
      <div className="space-y-4">
        {roles.map((role) => (
          <div key={role.name} className="border p-4 rounded-lg flex justify-between items-center">
            <div>
              <h4 className="font-bold text-lg">{role.name}</h4>
              <p className="text-sm text-gray-600">{role.description}</p>
              <p className="text-xs text-gray-500 mt-1">{role.userCount} users</p>
            </div>
            <div className="flex space-x-2">
              <button className="p-2 rounded-full hover:bg-gray-200">
                <Edit size={20} />
              </button>
              {role.name !== 'Super Admin' && (
                <button className="p-2 rounded-full hover:bg-gray-200 text-red-600">
                  <Trash2 size={20} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RolesPermissionsSettings;
