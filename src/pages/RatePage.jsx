import Rate from '../components/Rate';
import { useAuth } from '../context/AuthContext';

const RatePage = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Manage Your Rates</h1>
      {/* This ensures the Rate component gets the required ID */}
      {user ? <Rate rateId={user.uid} /> : <p>Loading user data...</p>}
    </div>
  );
};

export default RatePage;