import React from 'react';

const LoadingDashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50">
      <div className="space-y-8 p-6">
        {/* Loading Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 rounded-2xl shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/90 to-blue-600/90"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-48 translate-x-48 blur-3xl animate-pulse"></div>
          
          <div className="relative p-8">
            <div className="flex items-center justify-between">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-8 bg-white/20 rounded-lg w-64 animate-pulse"></div>
                    <div className="h-5 bg-white/10 rounded-lg w-48 animate-pulse"></div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="h-4 bg-white/20 rounded w-20 animate-pulse"></div>
                  <div className="h-4 bg-white/20 rounded w-24 animate-pulse"></div>
                  <div className="h-4 bg-white/20 rounded w-16 animate-pulse"></div>
                </div>
              </div>
              
              <div className="hidden lg:flex items-center space-x-4">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 animate-pulse">
                  <div className="h-8 bg-white/20 rounded w-12 mb-2"></div>
                  <div className="h-4 bg-white/10 rounded w-16"></div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 animate-pulse">
                  <div className="h-8 bg-white/20 rounded w-12 mb-2"></div>
                  <div className="h-4 bg-white/10 rounded w-16"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gray-200 rounded-2xl"></div>
                <div className="w-12 h-4 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
                <div className="w-full bg-gray-200 rounded-full h-3"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Loading Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column Loading */}
          <div className="lg:col-span-2 space-y-6">
            {/* Assignments Loading */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 animate-pulse">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
                  <div className="space-y-2">
                    <div className="h-5 bg-gray-200 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
                <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
              </div>
              
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white/50 rounded-xl p-5 border border-white/30">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="h-5 bg-gray-200 rounded w-32"></div>
                          <div className="h-4 bg-gray-200 rounded-full w-16"></div>
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-48"></div>
                        <div className="h-4 bg-gray-200 rounded w-64"></div>
                        <div className="flex space-x-6">
                          <div className="h-3 bg-gray-200 rounded w-16"></div>
                          <div className="h-3 bg-gray-200 rounded w-20"></div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
                        <div className="w-16 h-10 bg-gray-200 rounded-xl"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Map Loading */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden animate-pulse">
              <div className="p-6 border-b border-white/20">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
                  <div className="space-y-2">
                    <div className="h-5 bg-gray-200 rounded w-24"></div>
                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                  </div>
                </div>
              </div>
              <div className="h-96 bg-gradient-to-br from-gray-200 to-gray-300"></div>
            </div>
          </div>

          {/* Right Column Loading */}
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 animate-pulse">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
                  <div className="space-y-2">
                    <div className="h-5 bg-gray-200 rounded w-28"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="h-16 bg-gray-200 rounded-xl"></div>
                  <div className="h-12 bg-gray-200 rounded-xl"></div>
                  <div className="h-8 bg-gray-200 rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingDashboard;