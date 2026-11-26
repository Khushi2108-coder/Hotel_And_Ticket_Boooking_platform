import { useState } from "react";
import OwnerSidebar from "../../components/dashboard/OwnerSidebar";
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import StatusBadge from "../../components/dashboard/StatusBadge";
import ConfirmActionModal from "../../components/dashboard/ConfirmActionModal";
import { mockOwnerProperties } from "../../data/mockDashboardData";
import { useCurrency } from "../../context/CurrencyContext";

/**
 * StayEase — Property Management (/owner/properties)
 */
export default function PropertyManagement({ onNotify }) {
  const { formatPrice } = useCurrency();
  const [properties, setProperties] = useState(mockOwnerProperties);
  const [filter, setFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);

  const [form, setForm] = useState({
    name: "",
    city: "",
    location: "",
    category: "Boutique Hotel",
    basePrice: "",
    description: "",
    image: "",
    amenities: "Swimming Pool, Free Wi-Fi, Restaurant",
  });

  const filteredProperties = properties.filter((p) => {
    if (filter === "all") return true;
    return p.status.toLowerCase() === filter.toLowerCase();
  });

  const handleOpenAdd = () => {
    setEditingProperty(null);
    setForm({
      name: "",
      city: "",
      location: "",
      category: "Boutique Hotel",
      basePrice: "",
      description: "",
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80",
      amenities: "Swimming Pool, Free Wi-Fi, Restaurant",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prop) => {
    setEditingProperty(prop);
    setForm({
      name: prop.name,
      city: prop.city,
      location: prop.location,
      category: prop.category,
      basePrice: prop.basePrice,
      description: prop.description,
      image: prop.image,
      amenities: prop.amenities.join(", "),
    });
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.city.trim() || !form.basePrice) {
      if (onNotify) {
        onNotify({
          type: "warning",
          title: "Required Fields",
          message: "Please fill in Property Name, City, and Base Price.",
        });
      }
      return;
    }

    if (editingProperty) {
      setProperties((prev) =>
        prev.map((p) =>
          p.id === editingProperty.id
            ? {
                ...p,
                name: form.name,
                city: form.city,
                location: form.location,
                category: form.category,
                basePrice: Number(form.basePrice),
                description: form.description,
                image: form.image,
                amenities: form.amenities.split(",").map((a) => a.trim()).filter(Boolean),
              }
            : p
        )
      );
      if (onNotify) {
        onNotify({
          type: "success",
          title: "Property Updated",
          message: `${form.name} details have been updated.`,
        });
      }
    } else {
      const newProp = {
        id: `prop-${Date.now()}`,
        name: form.name,
        city: form.city,
        location: form.location || `${form.city}, India`,
        category: form.category,
        status: "Active",
        rating: 5.0,
        reviewCount: 0,
        basePrice: Number(form.basePrice),
        totalRooms: 6,
        activeBookings: 0,
        image: form.image || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80",
        description: form.description || "Luxury curated stay on StayEase.",
        amenities: form.amenities.split(",").map((a) => a.trim()).filter(Boolean),
      };
      setProperties((prev) => [newProp, ...prev]);
      if (onNotify) {
        onNotify({
          type: "success",
          title: "Property Listed! 🎉",
          message: `${form.name} has been added to your portfolio.`,
        });
      }
    }

    setIsModalOpen(false);
  };

  const handleArchive = () => {
    if (!archiveTarget) return;
    setProperties((prev) =>
      prev.map((p) =>
        p.id === archiveTarget.id
          ? { ...p, status: p.status === "Archived" ? "Active" : "Archived" }
          : p
      )
    );
    if (onNotify) {
      onNotify({
        type: "info",
        title: "Status Changed",
        message: `${archiveTarget.name} status updated.`,
      });
    }
    setArchiveTarget(null);
  };

  return (
    <div className="flex min-h-screen bg-[#fcfbf8] text-[#26382d] transition-colors duration-300 dark:bg-[#0c120e] dark:text-[#f0f4f0]">
      <OwnerSidebar />

      <main className="flex-1 overflow-y-auto px-5 py-8 sm:px-8 lg:px-12">
        <DashboardHeader
          title="Property Portfolio Management"
          subtitle="Add, configure, and manage luxury retreats, boutique resorts, and villas."
          eyebrow="Portfolio Control"
          actionText="+ Add New Property"
          onActionClick={handleOpenAdd}
        />

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-[#e9e5dc] pb-3 text-xs dark:border-[#2a3c30]">
          {["all", "active", "draft", "archived"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilter(st)}
              className={`rounded-xl px-3.5 py-1.5 font-semibold capitalize transition ${
                filter === st
                  ? "bg-[#244b38] text-white dark:bg-[#34d399] dark:text-[#0a120e]"
                  : "text-[#757b72] hover:bg-[#edf3ec] dark:hover:bg-[#1f3025]"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Property Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredProperties.map((prop) => (
            <article
              key={prop.id}
              className="group overflow-hidden rounded-3xl border border-[#e9e5dc] bg-white shadow-xs transition-all duration-200 hover:shadow-md dark:border-[#2a3c30] dark:bg-[#152019]"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#eee]">
                <img
                  src={prop.image}
                  alt={prop.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-104"
                />
                <div className="absolute top-3 left-3">
                  <StatusBadge status={prop.status} />
                </div>
                <div className="absolute top-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-xs">
                  ★ {prop.rating}
                </div>
              </div>

              <div className="p-5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#b18a57] dark:text-[#fbbf24]">
                  {prop.category}
                </span>
                <h3 className="mt-1 font-serif text-lg font-bold text-[#244b38] dark:text-[#f0f4f0]">
                  {prop.name}
                </h3>
                <p className="text-xs text-[#757b72] dark:text-[#9aa59d]">
                  📍 {prop.location}
                </p>

                <div className="mt-4 flex items-center justify-between border-y border-[#eeece6] py-3 text-xs dark:border-[#243329]">
                  <div>
                    <span className="text-[10px] text-[#757b72] block">Base Rate</span>
                    <strong className="text-sm text-[#244b38] dark:text-[#34d399]">
                      {formatPrice(prop.basePrice)}
                    </strong>
                    <span className="text-[10px] text-[#858f87]"> / night</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#757b72] block">Rooms</span>
                    <strong>{prop.totalRooms} Units</strong>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(prop)}
                    className="rounded-xl border border-[#dedbd2] px-3.5 py-2 text-xs font-semibold hover:bg-[#f6f4ed] dark:border-[#2d3d32] dark:hover:bg-[#1f2d23]"
                  >
                    Edit Property
                  </button>
                  <button
                    type="button"
                    onClick={() => setArchiveTarget(prop)}
                    className="rounded-xl border border-[#dedbd2] px-3 py-2 text-xs font-semibold text-[#c53030] hover:bg-[#fff5f5] dark:border-[#2d3d32] dark:hover:bg-[#2b1717]"
                  >
                    {prop.status === "Archived" ? "Unarchive" : "Archive"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Add/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[#e9e5dc] bg-white p-6 shadow-2xl dark:border-[#2a3c30] dark:bg-[#152019]">
              <div className="flex items-center justify-between pb-3 border-b border-[#eeece6] dark:border-[#243329]">
                <h3 className="font-serif text-xl font-medium text-[#244b38] dark:text-[#f0f4f0]">
                  {editingProperty ? "Edit Property Details" : "List New Luxury Property"}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-base text-[#858f87] hover:text-black dark:hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSave} className="mt-5 space-y-4 text-xs">
                <div>
                  <label className="mb-1 block font-semibold">Property Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Coastal Palm Retreat"
                    className="w-full rounded-xl border border-[#dedbd2] bg-[#fbf9f4] p-2.5 outline-none focus:border-[#244b38] dark:border-[#2d3d32] dark:bg-[#111914]"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block font-semibold">City *</label>
                    <input
                      type="text"
                      required
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      placeholder="e.g. Goa"
                      className="w-full rounded-xl border border-[#dedbd2] bg-[#fbf9f4] p-2.5 outline-none focus:border-[#244b38] dark:border-[#2d3d32] dark:bg-[#111914]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-semibold">Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full rounded-xl border border-[#dedbd2] bg-[#fbf9f4] p-2.5 outline-none focus:border-[#244b38] dark:border-[#2d3d32] dark:bg-[#111914]"
                    >
                      <option>Beachfront Resort</option>
                      <option>Heritage Palace</option>
                      <option>Mountain Chalet</option>
                      <option>Boutique Haveli</option>
                      <option>Eco Forest Villa</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-semibold">Full Location / Address</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="e.g. Candolim Beach Road, North Goa"
                    className="w-full rounded-xl border border-[#dedbd2] bg-[#fbf9f4] p-2.5 outline-none focus:border-[#244b38] dark:border-[#2d3d32] dark:bg-[#111914]"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block font-semibold">Base Price (INR per night) *</label>
                    <input
                      type="number"
                      required
                      min={500}
                      value={form.basePrice}
                      onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                      placeholder="4500"
                      className="w-full rounded-xl border border-[#dedbd2] bg-[#fbf9f4] p-2.5 outline-none focus:border-[#244b38] dark:border-[#2d3d32] dark:bg-[#111914]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-semibold">Hero Image URL</label>
                    <input
                      type="url"
                      value={form.image}
                      onChange={(e) => setForm({ ...form, image: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full rounded-xl border border-[#dedbd2] bg-[#fbf9f4] p-2.5 outline-none focus:border-[#244b38] dark:border-[#2d3d32] dark:bg-[#111914]"
                    />
                  </div>
                </div>

                {/* Cloudinary Upload UI Placeholder */}
                <div className="rounded-2xl border border-dashed border-[#c5c1b5] bg-[#faf8f2] p-4 text-center dark:border-[#35483b] dark:bg-[#131d17]">
                  <span className="text-xl block">📷</span>
                  <strong className="block mt-1">Upload Property Photos via Cloudinary</strong>
                  <p className="text-[11px] text-[#757b72] mt-0.5">
                    Cloudinary CDN upload integration scheduled for Phase 2. Using URL previews in this phase.
                  </p>
                </div>

                <div>
                  <label className="mb-1 block font-semibold">Amenities (comma-separated)</label>
                  <input
                    type="text"
                    value={form.amenities}
                    onChange={(e) => setForm({ ...form, amenities: e.target.value })}
                    className="w-full rounded-xl border border-[#dedbd2] bg-[#fbf9f4] p-2.5 outline-none focus:border-[#244b38] dark:border-[#2d3d32] dark:bg-[#111914]"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-semibold">Description</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full rounded-xl border border-[#dedbd2] bg-[#fbf9f4] p-2.5 outline-none focus:border-[#244b38] dark:border-[#2d3d32] dark:bg-[#111914]"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-[#eeece6] dark:border-[#243329]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl border border-[#dedbd2] px-4 py-2.5 font-semibold dark:border-[#2d3d32]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#244b38] px-5 py-2.5 font-semibold text-white hover:bg-[#193829] dark:bg-[#34d399] dark:text-[#0b120e]"
                  >
                    {editingProperty ? "Save Changes" : "Create Property"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        <ConfirmActionModal
          isOpen={!!archiveTarget}
          title={archiveTarget?.status === "Archived" ? "Unarchive Property?" : "Archive Property?"}
          message={`Are you sure you want to change the status of ${archiveTarget?.name}? Archived properties will no longer appear in guest search results.`}
          confirmText={archiveTarget?.status === "Archived" ? "Unarchive" : "Archive"}
          onConfirm={handleArchive}
          onCancel={() => setArchiveTarget(null)}
        />
      </main>
    </div>
  );
}

