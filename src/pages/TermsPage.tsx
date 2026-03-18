import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TermsPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to privacy page which now contains both privacy and terms
    navigate('/privacy', { replace: true });
  }, [navigate]);

  return null;
};

export default TermsPage;
