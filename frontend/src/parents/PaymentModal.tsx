import React, { useState } from 'react';
import { ApiStudent } from './dashboardTypes';
import { X, CreditCard } from 'lucide-react';

interface PaymentModalProps {
  student: ApiStudent | null;
  onClose: () => void;
  onSubmit: (studentId: string, plan: string, mobileNumber?: string) => void;
}

type Curriculum = 'local' | 'cambridge' | '';
type PaymentMethod = 'mtn' | 'airtel' | 'zamtel' | 'card' | '';

const PaymentModal: React.FC<PaymentModalProps> = ({ student, onClose, onSubmit }) => {
  const [selectedCurriculum, setSelectedCurriculum] = useState<Curriculum>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!student) return null;

  const getPrice = () => {
    if (selectedCurriculum === 'local') return 95;
    if (selectedCurriculum === 'cambridge') return 150;
    return 0;
  };

  const isMobileMoney = ['mtn', 'airtel', 'zamtel'].includes(paymentMethod);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedCurriculum) {
      setError('Please select a curriculum.');
      return;
    }
    if (!paymentMethod) {
      setError('Please select a payment method.');
      return;
    }
    if (isMobileMoney && !mobileNumber.match(/^(\d{9,10})$/)) {
      setError('Please enter a valid 9 or 10-digit mobile number.');
      return;
    }
    
    setLoading(true);
    // Simulate API call
    console.log('Submitting payment...', {
      studentId: student._id,
      plan: selectedCurriculum,
      paymentMethod,
      mobileNumber: isMobileMoney ? mobileNumber : undefined
    });
    
    // In a real app, you would call your payment API here
    // await submitPayment(...)
    
    await new Promise(resolve => setTimeout(resolve, 1500)); // Fake delay
    
    setLoading(false);
    
    // Call the provided onSubmit prop
    onSubmit(student._id, selectedCurriculum, isMobileMoney ? mobileNumber : undefined);
    onClose();
  };

  const handleMethodClick = (method: PaymentMethod, price: number) => {
    setPaymentMethod(method);
    if (['mtn', 'airtel', 'zamtel'].includes(method)) {
      setMobileNumber(`K${price}`);
    } else {
      setMobileNumber('');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg relative transition-all transform scale-100 opacity-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Upgrade {student.childName}
        </h2>
        <p className="text-gray-500 mb-6">
          Select a curriculum and payment method to unlock premium access.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Curriculum */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">1. Select Curriculum</h3>
            <div className="grid grid-cols-2 gap-4">
              <div
                onClick={() => setSelectedCurriculum('local')}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedCurriculum === 'local' ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <h4 className="font-bold text-gray-800">Local Curriculum</h4>
                <p className="text-2xl font-extrabold text-indigo-600">K95 <span className="text-sm font-normal text-gray-500">/month</span></p>
              </div>
              <div
                onClick={() => setSelectedCurriculum('cambridge')}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedCurriculum === 'cambridge' ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <h4 className="font-bold text-gray-800">Cambridge Curriculum</h4>
                <p className="text-2xl font-extrabold text-indigo-600">K150 <span className="text-sm font-normal text-gray-500">/month</span></p>
              </div>
            </div>
          </div>

          {/* Step 2: Payment Method */}
          {selectedCurriculum && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">2. Select Payment Method</h3>
              <div className="flex space-x-2">
                {/* Mobile Money Options */}
                {['mtn', 'airtel', 'zamtel'].map((method) => (
                  <button
                    type="button"
                    key={method}
                    onClick={() => handleMethodClick(method as PaymentMethod, getPrice())}
                    className={`flex-1 p-3 border-2 rounded-lg font-semibold capitalize transition-all ${
                      paymentMethod === method ? `border-${method} text-${method} shadow-md` : 'border-gray-300 text-gray-500 hover:border-gray-400'
                    }`}
                    style={
                      paymentMethod === method ? { 
                        borderColor: method === 'mtn' ? '#FFC107' : (method === 'airtel' ? '#ED1C24' : '#00A859'), 
                        color: method === 'mtn' ? '#FFC107' : (method === 'airtel' ? '#ED1C24' : '#00A859')
                      } : {}
                    }
                  >
                    {method}
                  </button>
                ))}
                {/* Card Option */}
                 <button
                    type="button"
                    onClick={() => handleMethodClick('card', getPrice())}
                    className={`flex-1 p-3 border-2 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all ${
                      paymentMethod === 'card' ? 'border-blue-600 text-blue-600 shadow-md' : 'border-gray-300 text-gray-500 hover:border-gray-400'
                    }`}
                  >
                    <CreditCard size={18} />
                    <span>Card</span>
                  </button>
              </div>
            </div>
          )}
          
          {/* Step 3: Payment Details */}
          {paymentMethod && (
             <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">3. Payment Details</h3>
                {isMobileMoney ? (
                  <div>
                    <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      id="mobileNumber"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="Enter 9 or 10-digit number"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      You will receive a payment prompt on this number for K{getPrice()}.
                    </p>
                  </div>
                ) : (
                   <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                    <p className="font-semibold text-blue-700">You will be redirected to our secure card payment processor.</p>
                  </div>
                )}
             </div>
          )}

          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition flex items-center"
              disabled={!paymentMethod || loading}
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : 'Submit Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;