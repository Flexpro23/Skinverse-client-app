import React, { useState } from 'react';
import Button from './shared/Button';
import InputField from './shared/InputField';
import AnimatedLogo from './shared/AnimatedLogo';
import IndicatorPill from './shared/IndicatorPill';

const TestPage: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (inputError) setInputError('');
  };

  const validateInput = () => {
    if (!inputValue.trim()) {
      setInputError('This field is required');
      return false;
    }
    if (inputValue.length < 3) {
      setInputError('Must be at least 3 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (validateInput()) {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        alert('Form submitted successfully!');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-light-grey p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-h1 text-midnight-blue mb-4">
            SkinVerse Component Library Test
          </h1>
          <p className="text-body text-medium-grey">
            Testing all components with the Precision Luxury design system
          </p>
        </div>

        {/* Logo Section */}
        <section className="mb-12">
          <h2 className="text-h2 text-midnight-blue mb-6">Animated Logo</h2>
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-center">
              <div className="text-center">
                <p className="text-label text-midnight-blue mb-4">Small</p>
                <AnimatedLogo size="small" />
              </div>
              <div className="text-center">
                <p className="text-label text-midnight-blue mb-4">Medium</p>
                <AnimatedLogo size="medium" />
              </div>
              <div className="text-center">
                <p className="text-label text-midnight-blue mb-4">Large</p>
                <AnimatedLogo size="large" />
              </div>
              <div className="text-center">
                <p className="text-label text-midnight-blue mb-4">Animated</p>
                <AnimatedLogo size="medium" animate={true} />
              </div>
            </div>
          </div>
        </section>

        {/* Buttons Section */}
        <section className="mb-12">
          <h2 className="text-h2 text-midnight-blue mb-6">Buttons</h2>
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-body font-semibold text-midnight-blue mb-4">Primary Buttons</h3>
                <div className="space-y-4">
                  <Button variant="primary">Standard Primary</Button>
                  <Button variant="primary" fullWidth>Full Width Primary</Button>
                  <Button variant="primary" disabled>Disabled Primary</Button>
                  <Button variant="primary" isLoading={isLoading}>
                    {isLoading ? 'Loading...' : 'Loading State'}
                  </Button>
                </div>
              </div>
              <div>
                <h3 className="text-body font-semibold text-midnight-blue mb-4">Secondary Buttons</h3>
                <div className="space-y-4">
                  <Button variant="secondary">Standard Secondary</Button>
                  <Button variant="secondary" fullWidth>Full Width Secondary</Button>
                  <Button variant="secondary" disabled>Disabled Secondary</Button>
                  <Button variant="secondary" onClick={handleSubmit}>
                    Test Submit
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Input Fields Section */}
        <section className="mb-12">
          <h2 className="text-h2 text-midnight-blue mb-6">Input Fields</h2>
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <InputField
                  label="Phone Number"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  helperText="Enter your phone number with country code"
                />
                <InputField
                  label="First Name"
                  type="text"
                  placeholder="Jane"
                />
                <InputField
                  label="Email (Optional)"
                  type="email"
                  placeholder="jane@example.com"
                  helperText="We'll use this for updates"
                />
              </div>
              <div className="space-y-6">
                <InputField
                  label="Test Input with Validation"
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  error={inputError}
                  placeholder="Type something (min 3 characters)"
                />
                <InputField
                  label="Error State Example"
                  type="text"
                  error="This is an error message"
                  placeholder="This field has an error"
                />
                <InputField
                  label="Full Width Input"
                  type="text"
                  placeholder="This input takes full width"
                  fullWidth
                />
              </div>
            </div>
          </div>
        </section>

        {/* Indicator Pills Section */}
        <section className="mb-12">
          <h2 className="text-h2 text-midnight-blue mb-6">Indicator Pills</h2>
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-body font-semibold text-midnight-blue mb-4">Camera Indicators</h3>
                <div className="space-y-4">
                  <IndicatorPill 
                    label="Face Position" 
                    text="Align with mask" 
                    status="default" 
                  />
                  <IndicatorPill 
                    label="Face Position" 
                    text="Perfect! Hold still" 
                    status="success" 
                  />
                  <IndicatorPill 
                    label="Lighting" 
                    text="Needs more light" 
                    status="error" 
                  />
                  <IndicatorPill 
                    label="Lighting" 
                    text="Good lighting" 
                    status="success" 
                  />
                </div>
              </div>
              <div>
                <h3 className="text-body font-semibold text-midnight-blue mb-4">Status Indicators</h3>
                <div className="space-y-4">
                  <IndicatorPill 
                    label="Connection" 
                    text="Connecting..." 
                    status="warning" 
                  />
                  <IndicatorPill 
                    label="Analysis" 
                    text="Processing" 
                    status="default" 
                  />
                  <IndicatorPill 
                    label="Analysis" 
                    text="Complete" 
                    status="success" 
                  />
                  <IndicatorPill 
                    label="System" 
                    text="Error occurred" 
                    status="error" 
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Typography Section */}
        <section className="mb-12">
          <h2 className="text-h2 text-midnight-blue mb-6">Typography Scale</h2>
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <div className="space-y-6">
              <div>
                <h1 className="text-h1 text-midnight-blue">H1 - Primary Screen Titles</h1>
                <p className="text-label text-medium-grey">32px, Font Weight 700</p>
              </div>
              <div>
                <h2 className="text-h2 text-midnight-blue">H2 - Section Headers</h2>
                <p className="text-label text-medium-grey">24px, Font Weight 600</p>
              </div>
              <div>
                <p className="text-body text-midnight-blue">Body - Main content and paragraph text</p>
                <p className="text-label text-medium-grey">18px, Font Weight 400</p>
              </div>
              <div>
                <p className="text-label text-midnight-blue">Label - Input field labels and helper text</p>
                <p className="text-label text-medium-grey">14px, Font Weight 500</p>
              </div>
            </div>
          </div>
        </section>

        {/* Color Palette Section */}
        <section className="mb-12">
          <h2 className="text-h2 text-midnight-blue mb-6">Color Palette</h2>
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-midnight-blue rounded-lg mx-auto mb-2"></div>
                <p className="text-label text-midnight-blue">Midnight Blue</p>
                <p className="text-xs text-medium-grey">#192A51</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-bronze rounded-lg mx-auto mb-2"></div>
                <p className="text-label text-midnight-blue">Bronze</p>
                <p className="text-xs text-medium-grey">#C5A475</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-clinical-green rounded-lg mx-auto mb-2"></div>
                <p className="text-label text-midnight-blue">Clinical Green</p>
                <p className="text-xs text-medium-grey">#2E7D32</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-alert-red rounded-lg mx-auto mb-2"></div>
                <p className="text-label text-midnight-blue">Alert Red</p>
                <p className="text-xs text-medium-grey">#C62828</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default TestPage;

