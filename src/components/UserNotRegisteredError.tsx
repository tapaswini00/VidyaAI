import React from "react";

interface UserNotRegisteredErrorProps {
  onSignOut?: () => void;
}

const UserNotRegisteredError: React.FC<UserNotRegisteredErrorProps> = ({ onSignOut }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg border border-slate-100 animate-scale-up">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-orange-100">
            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4 font-display tracking-tight">Access Restricted</h1>
          <p className="text-slate-600 mb-8 text-sm">
            You are not registered to use this application. Please contact the app administrator to request access.
          </p>
          <div className="p-4 bg-slate-50 rounded-xl text-left text-xs text-slate-600 border border-slate-100 font-medium">
            <p className="font-bold text-slate-700">If you believe this is an error, you can:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Verify you are logged in with the correct account</li>
              <li>Contact the app administrator for access</li>
              <li>Try logging out and back in again</li>
            </ul>
          </div>
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="mt-6 w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 shadow-sm"
            >
              Log Out of Student Session
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserNotRegisteredError;
