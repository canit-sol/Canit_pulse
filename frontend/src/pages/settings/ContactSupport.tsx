import SettingsLayout from "../../components/SettingsLayout";
import { LifeBuoy, Mail, Phone, MapPin, Globe } from "lucide-react";

export default function ContactSupport() {
  return (
    <SettingsLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-[#113a87] to-[#1e56b8] rounded-xl text-white shadow-lg shadow-[#113a87]/15">
            <LifeBuoy size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#1a1a1a] tracking-tight font-heading">
              Contact Support
            </h1>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              Get assistance with your platform, reports, or technical queries.
            </p>
          </div>
        </div>

        {/* Content Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Main Info Card */}
          <div className="md:col-span-2 glass-panel p-6 shadow-soft hover:shadow-glass hover:border-slate-300 transition-all duration-300">
            <h2 className="text-lg font-black mb-1 text-slate-800 font-heading">
              We’re here to help you grow
            </h2>
            <p className="text-xs leading-relaxed text-slate-500 font-semibold mb-6">
              Leave us a quick message. We shall revert to discuss how we can help you grow with digital media.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100/60 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center border border-slate-150 shadow-sm shrink-0">
                  <Phone className="w-4 h-4 text-[#113a87]" />
                </div>
                <div>
                  <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Phone number</div>
                  <div className="text-xs font-black text-slate-800 mt-0.5">+91 80157 61045</div>
                </div>
              </div>

              <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100/60 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center border border-slate-150 shadow-sm shrink-0">
                  <Mail className="w-4 h-4 text-[#113a87]" />
                </div>
                <div>
                  <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Email ID</div>
                  <a href="mailto:digital@canit.in" className="text-xs font-black text-slate-800 mt-0.5 hover:text-[#113a87] hover:underline">
                    digital@canit.in
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Location & Map Card */}
          <div className="glass-panel p-6 shadow-soft hover:shadow-glass hover:border-slate-300 transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 font-heading flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-500" /> Office Address
              </h3>
              <p className="text-xs leading-relaxed text-slate-500 font-semibold">
                TCR Niveras Plaza (3rd Floor) 205/325, Poonamallee High Road, Aminjikarai Chennai – 600 029 Tamil Nadu, India.
              </p>
            </div>
            
            <div className="pt-6">
              <a
                href="https://maps.google.com/?q=TCR+Niveras+Plaza+Chennai"
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#113a87] hover:bg-[#1e56b8] text-white text-xs font-black rounded-xl shadow-md transition-all hover:scale-105 active:scale-95"
              >
                <Globe className="w-4 h-4" /> VIEW ON MAP
              </a>
            </div>
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
}
