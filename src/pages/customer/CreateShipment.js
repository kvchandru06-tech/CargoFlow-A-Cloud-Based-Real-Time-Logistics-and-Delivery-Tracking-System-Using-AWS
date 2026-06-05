import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { ArrowRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline';import toast from 'react-hot-toast';

const STEPS = ['Recipient', 'Pickup', 'Delivery', 'Package', 'Review'];

const initialForm = {
  recipient_name: '', recipient_email: '', recipient_phone: '',
  pickup_address: '', pickup_city: '', pickup_state: '', pickup_zip: '', pickup_country: 'USA',
  delivery_address: '', delivery_city: '', delivery_state: '', delivery_zip: '', delivery_country: 'USA',
  package_type: 'parcel', weight: '1', dimensions: '', description: '',
  declared_value: '0', priority: 'standard', special_instructions: '',
};

export default function CreateShipment() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(null);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const costPreview = () => {
    const rates = { standard: 5, express: 12, overnight: 25 };
    const shipping = (rates[form.priority] || 5) + parseFloat(form.weight || 0) * 1.5;
    const insurance = parseFloat(form.declared_value || 0) * 0.01;
    return { shipping: shipping.toFixed(2), insurance: insurance.toFixed(2), total: (shipping + insurance).toFixed(2) };
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await api.post('/shipments', form);
      setCreated(res.data.shipment);
      toast.success('Shipment created successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create shipment');
    } finally {
      setLoading(false);
    }
  };

  if (created) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 animate-fade-in">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircleIcon className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Shipment Created!</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-2">Your tracking number is:</p>
        <p className="text-3xl font-bold font-mono text-brand-700 dark:text-brand-400 mb-6">{created.tracking_number}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate(`/customer/shipments/${created.id}`)} className="btn-primary">
            View Shipment
          </button>
          <button onClick={() => { setCreated(null); setForm(initialForm); setStep(0); }} className="btn-secondary">
            Create Another
          </button>
        </div>
      </div>
    );
  }

  const cost = costPreview();

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">New Shipment</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Fill in the details to create your shipment</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-2 ${i <= step ? 'text-brand-700 dark:text-brand-400' : 'text-slate-400'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < step ? 'bg-brand-700 text-white' :
                i === step ? 'bg-brand-700 text-white ring-4 ring-brand-200 dark:ring-brand-900' :
                'bg-slate-200 dark:bg-slate-700 text-slate-400'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className="text-xs font-medium hidden sm:block">{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 ${i < step ? 'bg-brand-700' : 'bg-slate-200 dark:bg-slate-700'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="card p-6">
        {/* Step 0: Recipient */}
        {step === 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900 dark:text-white text-lg">Recipient Information</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Name *</label>
              <input className="input" placeholder="John Doe" value={form.recipient_name} onChange={e => set('recipient_name', e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Phone *</label>
                <input className="input" placeholder="+1-555-0100" value={form.recipient_phone} onChange={e => set('recipient_phone', e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
                <input type="email" className="input" placeholder="recipient@example.com" value={form.recipient_email} onChange={e => set('recipient_email', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Pickup */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900 dark:text-white text-lg">Pickup Address</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Street Address *</label>
              <input className="input" placeholder="123 Main St" value={form.pickup_address} onChange={e => set('pickup_address', e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">City</label>
                <input className="input" placeholder="New York" value={form.pickup_city} onChange={e => set('pickup_city', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">State</label>
                <input className="input" placeholder="NY" value={form.pickup_state} onChange={e => set('pickup_state', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">ZIP Code</label>
                <input className="input" placeholder="10001" value={form.pickup_zip} onChange={e => set('pickup_zip', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Country</label>
                <input className="input" value={form.pickup_country} onChange={e => set('pickup_country', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Delivery */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900 dark:text-white text-lg">Delivery Address</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Street Address *</label>
              <input className="input" placeholder="456 Oak Ave" value={form.delivery_address} onChange={e => set('delivery_address', e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">City</label>
                <input className="input" placeholder="Los Angeles" value={form.delivery_city} onChange={e => set('delivery_city', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">State</label>
                <input className="input" placeholder="CA" value={form.delivery_state} onChange={e => set('delivery_state', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">ZIP Code</label>
                <input className="input" placeholder="90001" value={form.delivery_zip} onChange={e => set('delivery_zip', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Country</label>
                <input className="input" value={form.delivery_country} onChange={e => set('delivery_country', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Package */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900 dark:text-white text-lg">Package Details</h3>
            <div className="grid grid-cols-3 gap-2">
              {['parcel', 'document', 'freight'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set('package_type', t)}
                  className={`py-3 rounded-xl text-sm font-medium border transition-all capitalize ${
                    form.package_type === t
                      ? 'bg-brand-700 text-white border-brand-700'
                      : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {t === 'parcel' ? '📦' : t === 'document' ? '📄' : '🏗️'} {t}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Weight (kg)</label>
                <input type="number" min="0.1" step="0.1" className="input" value={form.weight} onChange={e => set('weight', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Dimensions (LxWxH cm)</label>
                <input className="input" placeholder="30x20x15" value={form.dimensions} onChange={e => set('dimensions', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Declared Value ($)</label>
                <input type="number" min="0" className="input" value={form.declared_value} onChange={e => set('declared_value', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Priority</label>
                <select className="input" value={form.priority} onChange={e => set('priority', e.target.value)}>
                  <option value="standard">Standard (3–5 days)</option>
                  <option value="express">Express (1–2 days)</option>
                  <option value="overnight">Overnight (next day)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
              <input className="input" placeholder="What's inside?" value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Special Instructions</label>
              <textarea className="input resize-none" rows={2} placeholder="Handle with care, fragile..." value={form.special_instructions} onChange={e => set('special_instructions', e.target.value)} />
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900 dark:text-white text-lg">Review & Confirm</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Recipient</p>
                <p className="font-semibold text-slate-900 dark:text-white">{form.recipient_name}</p>
                <p className="text-sm text-slate-500">{form.recipient_phone}</p>
                {form.recipient_email && <p className="text-sm text-slate-500">{form.recipient_email}</p>}
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Package</p>
                <p className="font-semibold text-slate-900 dark:text-white capitalize">{form.package_type} · {form.weight}kg</p>
                <p className="text-sm text-slate-500 capitalize">{form.priority} priority</p>
                {form.dimensions && <p className="text-sm text-slate-500">{form.dimensions}</p>}
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">From</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">{form.pickup_address}</p>
                <p className="text-sm text-slate-500">{form.pickup_city}, {form.pickup_state} {form.pickup_zip}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">To</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">{form.delivery_address}</p>
                <p className="text-sm text-slate-500">{form.delivery_city}, {form.delivery_state} {form.delivery_zip}</p>
              </div>
            </div>
            <div className="bg-brand-50 dark:bg-brand-900/20 rounded-xl p-4 border border-brand-100 dark:border-brand-800">
              <p className="text-xs text-brand-600 dark:text-brand-400 uppercase tracking-wide mb-3 font-semibold">Cost Breakdown</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Shipping ({form.priority})</span>
                  <span>${cost.shipping}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Insurance (1% of ${form.declared_value})</span>
                  <span>${cost.insurance}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-2 border-t border-brand-200 dark:border-brand-700">
                  <span>Total</span>
                  <span className="text-brand-700 dark:text-brand-400">${cost.total}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
          <button
            onClick={() => setStep(p => p - 1)}
            disabled={step === 0}
            className="btn-secondary disabled:opacity-40"
          >
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(p => p + 1)}
              disabled={
                (step === 0 && (!form.recipient_name || !form.recipient_phone)) ||
                (step === 1 && !form.pickup_address) ||
                (step === 2 && !form.delivery_address)
              }
              className="btn-primary disabled:opacity-40"
            >
              Continue <ArrowRightIcon className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} className="btn-primary">
              {loading ? 'Creating...' : 'Create Shipment'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
