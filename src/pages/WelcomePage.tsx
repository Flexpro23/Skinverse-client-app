import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatedLogo, Button, InputField } from '../components/shared';
import { useAppActions, useClinicId } from '../store/useAppStore';

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const clinicId = useClinicId();
  const { setClientInfo, setAuthenticated, setAppStatus } = useAppActions();

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s\-()]{10,}$/.test(phone.trim())) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!age.trim()) {
      newErrors.age = 'Age is required';
    } else if (isNaN(Number(age)) || Number(age) < 13 || Number(age) > 120) {
      newErrors.age = 'Please enter a valid age (13-120)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle client preparation (existing or new client)
  const handlePrepareClient = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setAppStatus('authenticating');

    try {
      const { getClientProfile, createClientProfile } = await import('../services/firebase');
      // Check if client exists
      const existingClient = await getClientProfile(clinicId, phone.trim());
      
      if (existingClient) {
        // Existing client
        setClientInfo({
          firstName: existingClient.firstName,
          lastName: existingClient.lastName,
          phone: existingClient.phone,
          email: existingClient.email || '',
          age: existingClient.age || 25, // Default age if not stored
          isReturning: true,
          clientId: phone.replace(/[^0-9]/g, '')
        });
      } else {
        // New client - create profile
        const clientId = await createClientProfile(clinicId, {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          age: Number(age)
        });

        if (clientId) {
          setClientInfo({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: phone.trim(),
            email: email.trim(),
            age: Number(age),
            isReturning: false,
            clientId
          });
        } else {
          throw new Error('Failed to create client profile');
        }
      }

      setAuthenticated(true);
      setAppStatus('idle');
      navigate('/scan');
    } catch (error) {
      console.error('Error preparing client:', error);
      setErrors({ general: 'Failed to prepare client. Please try again.' });
      setAppStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle guest scan (skip client info)
  const handleGuestScan = () => {
    setClientInfo({
      firstName: 'Guest',
      lastName: 'User',
      phone: '+1234567890',
      email: 'guest@example.com',
      age: 25,
      isReturning: false
    });
    setAuthenticated(false);
    setAppStatus('idle');
    navigate('/scan');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <AnimatedLogo size="large" animate={true} className="mb-6" />
          <h1 className="text-h1 text-midnight-blue mb-3">Welcome to SkinVerse</h1>
          <p className="text-body text-medium-grey">
            Precision skin analysis powered by AI
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-h2 text-midnight-blue mb-6 text-center">
            Client Information
          </h2>

          {/* Error Display */}
          {errors.general && (
            <div className="mb-6 p-4 bg-alert-red bg-opacity-10 border border-alert-red rounded-lg">
              <p className="text-alert-red text-label font-medium">{errors.general}</p>
            </div>
          )}

          {/* Form */}
          <div className="space-y-4 mb-8">
            <div className="flex flex-col md:flex-row md:space-x-4">
              <InputField
                label="First Name"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                error={errors.firstName}
                placeholder="Jane"
                disabled={isLoading}
                className="w-full"
              />
              <InputField
                label="Last Name"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                error={errors.lastName}
                placeholder="Smith"
                disabled={isLoading}
                className="w-full"
              />
            </div>

            <InputField
              label="Phone Number"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={errors.phone}
              placeholder="+1 (555) 123-4567"
              helperText="We'll use this to save your scan results"
              disabled={isLoading}
            />

            <InputField
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              placeholder="jane@example.com"
              helperText="Required for report delivery"
              disabled={isLoading}
            />

            <InputField
              label="Age"
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              error={errors.age}
              placeholder="25"
              helperText="Required for accurate skin analysis"
              disabled={isLoading}
              min={13}
              max={120}
            />
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Button
              variant="primary"
              fullWidth
              onClick={handlePrepareClient}
              isLoading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'Preparing...' : 'Prepare for Scan'}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-light-border-grey" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-medium-grey">or</span>
              </div>
            </div>

            <Button
              variant="secondary"
              fullWidth
              onClick={handleGuestScan}
              disabled={isLoading}
            >
              Run Guest Scan
            </Button>
          </div>

          {/* Info Note */}
          <div className="mt-6 p-4 bg-bronze bg-opacity-10 rounded-lg">
            <p className="text-label text-midnight-blue text-center">
              <strong>Note:</strong> Registered scans are saved to your profile. 
              Guest scans provide immediate analysis without data storage.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-label text-medium-grey">
            Powered by Precision Luxury Technology
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
