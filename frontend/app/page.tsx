import Link from 'next/link';
import {
  Zap, MapPin, Brain, BarChart3, Shield, Users,
  ArrowRight, CheckCircle, AlertTriangle, Clock, Globe,
} from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CityPulse AI — Report. Analyze. Act.',
  description: 'AI-powered pollution monitoring for cleaner, smarter and more sustainable cities.',
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0f1a]/80 backdrop-blur-xl border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-white">CityPulse</span>
              <span className="text-emerald-400 font-medium"> AI</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors px-4 py-2">
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-sm bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Background glows */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 left-1/4 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2 text-sm text-emerald-400 mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            AI-Powered Smart City Platform
          </div>

          <h1 className="text-5xl sm:text-7xl font-black mb-6 leading-none tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-100 to-gray-300">
              Report.
            </span>{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
              Analyze.
            </span>{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-100 to-gray-300">
              Act.
            </span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            AI-powered pollution monitoring for cleaner, smarter and more sustainable cities.
            Submit reports with photos. Get instant AI analysis. Drive municipal action.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-8 py-4 rounded-2xl text-base font-semibold hover:opacity-90 hover:scale-105 transition-all shadow-lg shadow-emerald-500/25"
            >
              Report an Issue <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 bg-gray-800 border border-gray-700 text-white px-8 py-4 rounded-2xl text-base font-medium hover:bg-gray-700 transition-colors"
            >
              Authority Login <Shield className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-6 border-y border-gray-800/50 bg-gray-900/30">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8">
          {[
            { value: 'AI-Powered', label: 'Analysis Engine' },
            { value: '7 Types', label: 'Pollution Categories' },
            { value: '4-Level', label: 'Severity System' },
            { value: 'Real-Time', label: 'Dashboard Updates' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-black text-white mb-1">{stat.value}</p>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black text-white mb-3">How It Works</h2>
            <p className="text-gray-400">From citizen report to municipal action in minutes</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '01', icon: MapPin, title: 'Report & Locate', desc: 'Citizens upload a photo, describe the issue, and pin the exact GPS location on the map.', color: 'emerald' },
              { step: '02', icon: Brain, title: 'AI Analysis', desc: 'Our AI engine instantly analyzes the report — identifying pollution type, severity, confidence score, and recommended action.', color: 'cyan' },
              { step: '03', icon: AlertTriangle, title: 'Priority Assignment', desc: 'Reports are automatically prioritized P1–P4 based on AI severity assessment for efficient triage.', color: 'orange' },
              { step: '04', icon: CheckCircle, title: 'Municipal Action', desc: 'Authority dashboard notifies inspectors who verify, assign, and resolve the issue with full status tracking.', color: 'green' },
            ].map((step) => {
              const Icon = step.icon;
              const colorMap: Record<string, string> = {
                emerald: 'from-emerald-500 to-cyan-500',
                cyan: 'from-cyan-500 to-blue-500',
                orange: 'from-orange-500 to-red-500',
                green: 'from-green-500 to-emerald-500',
              };
              return (
                <div key={step.step} className="relative bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors group">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorMap[step.color]} flex items-center justify-center mb-5 shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute top-4 right-4 text-4xl font-black text-gray-800 group-hover:text-gray-700 transition-colors">
                    {step.step}
                  </div>
                  <h3 className="font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features — Citizen & Authority */}
      <section className="py-20 px-6 bg-gray-900/30">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Citizen */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">For Citizens</h3>
                <p className="text-xs text-gray-400">Empower your community</p>
              </div>
            </div>
            <ul className="space-y-3">
              {[
                'Submit pollution reports with photo upload',
                'Auto-capture GPS location or pin on map',
                'Get instant AI analysis of your report',
                'View severity level and confidence score',
                'Track your report status in real-time',
                'Receive recommended municipal actions',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-gray-300">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className="mt-8 flex items-center justify-center gap-2 w-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 py-3 rounded-xl text-sm font-medium hover:bg-emerald-500/20 transition-colors"
            >
              Register as Citizen <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Authority */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">For Authorities</h3>
                <p className="text-xs text-gray-400">Smart city command center</p>
              </div>
            </div>
            <ul className="space-y-3">
              {[
                'Real-time dashboard with KPI overview',
                'Interactive pollution hotspot map',
                'Manage all reports with status workflow',
                'View AI analysis for each report',
                'Add authority notes and assign teams',
                'Analytics with trend charts and insights',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-gray-300">
                  <CheckCircle className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className="mt-8 flex items-center justify-center gap-2 w-full bg-purple-500/10 border border-purple-500/20 text-purple-400 py-3 rounded-xl text-sm font-medium hover:bg-purple-500/20 transition-colors"
            >
              Register as Authority <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* AI Capabilities */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black text-white mb-3">AI Capabilities</h2>
            <p className="text-gray-400">Powered by advanced language models and computer vision</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: Brain, title: 'Smart Categorization', desc: 'Automatically identifies pollution type from description and image: garbage, dumping, burning, smoke, plastic, water, and more.' },
              { icon: BarChart3, title: 'Severity Assessment', desc: 'Evaluates LOW → CRITICAL severity based on public health risk, scale of pollution, and environmental impact.' },
              { icon: Globe, title: 'Actionable Insights', desc: 'Generates specific, actionable recommendations for municipal teams — dispatch, inspection, enforcement, or remediation.' },
            ].map((cap) => {
              const Icon = cap.icon;
              return (
                <div key={cap.title} className="bg-gradient-to-br from-cyan-500/5 to-blue-500/5 border border-cyan-500/20 rounded-2xl p-6">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h3 className="font-bold text-white mb-2">{cap.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{cap.desc}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-6 px-5 py-4 bg-amber-500/5 border border-amber-500/20 rounded-xl text-sm text-amber-300 text-center">
            ⚠️ AI analysis provides guidance only and should be verified by qualified inspectors before enforcement action.
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-3xl p-12">
            <h2 className="text-3xl font-black text-white mb-4">Ready to make your city cleaner?</h2>
            <p className="text-gray-400 mb-8">Join CityPulse AI and help build smarter, more sustainable urban environments.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-8 py-4 rounded-2xl font-semibold hover:opacity-90 hover:scale-105 transition-all shadow-lg shadow-emerald-500/25"
              >
                Start Reporting <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/login" className="text-gray-400 hover:text-white text-sm transition-colors">
                Already have an account? Sign in →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-white">CityPulse AI</span>
        </div>
        <p className="text-xs text-gray-500">
          AI-Powered Urban Pollution Monitoring Platform · Built for smarter, cleaner cities
        </p>
      </footer>
    </div>
  );
}
