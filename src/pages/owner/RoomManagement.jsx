import { useState } from "react";
import OwnerSidebar from "../../components/dashboard/OwnerSidebar";
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import StatusBadge from "../../components/dashboard/StatusBadge";
import ConfirmActionModal from "../../components/dashboard/ConfirmActionModal";
import { mockOwnerRooms, mockOwnerProperties } from "../../data/mockDashboardData";
import { useCurrency } from "../../context/CurrencyContext";

/**
 * StayEase — Room Management (/owner/rooms)
 */
export default function RoomManagement({ onNotify }) {
  const { formatPrice } = useCurrency();
  const [rooms, setRooms] = useState(mockOwnerRooms);
  const [selectedPropertyId, setSelectedPropertyId] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [form, setForm] = useState({
    propertyId: mockOwnerProperties[0].id,
    name: "",
    type: "Standard",
    capacity: 2,
    beds: "1 Queen Bed",
    size: "260 sq ft",
    basePrice: "",
    totalUnits: 5,
    amenities: "Air Conditioning, High-speed Wi-Fi, Private Bath",
  });

  const filteredRooms = rooms.filter((r) => {
    if (selectedPropertyId === "all") return true;
    return r.propertyId === selectedPropertyId;
  });

  const handleOpenAdd = () => {
    setEditingRoom(null);
    setForm({
      propertyId: selectedPropertyId !== "all" ? selectedPropertyId : mockOwnerProperties[0].id,
      name: "",
      type: "Standard",
      capacity: 2,
      beds: "1 Queen Bed",
      size: "260 sq ft",
      basePrice: "",
      totalUnits: 5,
      amenities: "Air Conditioning, High-speed Wi-Fi, Private Bath",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rm) => {
    setEditingRoom(rm);
    setForm({
      propertyId: rm.propertyId,
      name: rm.name,
      type: rm.type,
      capacity: rm.capacity,
      beds: rm.beds,
      size: rm.size,
      basePrice: rm.basePrice,
      totalUnits: rm.totalUnits,
      amenities: rm.amenities.join(", "),
    });
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.basePrice || !form.totalUnits) {
      if (onNotify) {
        onNotify({
          type: "warning",
          title: "Incomplete Fields",
          message: "Please specify room name, base price, and total units.",
        });
      }
      return;
    }

    const prop = mockOwnerProperties.find((p) => p.id === form.propertyId) || mockOwnerProperties[0];

    if (editingRoom) {
      setRooms((prev) =>
        prev.map((r) =>
          r.id === editingRoom.id
            ? {
                ...r,
                propertyId: form.propertyId,
                propertyName: prop.name,
                name: form.name,
                type: form.type,
                capacity: Number(form.capacity),
                beds: form.beds,
                size: form.size,
                basePrice: Number(form.basePrice),
                totalUnits: Number(form.totalUnits),
                amenities: form.amenities.split(",").map((a) => a.trim()).filter(Boolean),
              }
            : r
        )
      );
      if (onNotify) {
        onNotify({
          type: "success",
          title: "Room Updated",
          message: `${form.name} configuration saved.`,
        });
      }
    } else {
      const newRoom = {
        id: `rm-${Date.now()}`,
        propertyId: form.propertyId,
        propertyName: prop.name,
        name: form.name,
        type: form.type,
        capacity: Number(form.capacity),
        beds: form.beds,
        size: form.size,
        basePrice: Number(form.basePrice),
        totalUnits: Number(form.totalUnits),
        availableUnits: Number(form.totalUnits),
        status: "Active",
        amenities: form.amenities.split(",").map((a) => a.trim()).filter(Boolean),
      };
      setRooms((prev) => [newRoom, ...prev]);
      if (onNotify) {
        onNotify({
          type: "success",
          title: "Room Type Added! 🚪",
          message: `${form.name} added under ${prop.name}.`,
        });
      }
    }

    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setRooms((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    if (onNotify) {
      onNotify({
        type: "info",
        title: "Room Removed",
        message: `${deleteTarget.name} has been deleted.`,
      });
    }
    setDeleteTarget(null);
  };

  return (
    <div className="flex min-h-screen bg-[#fcfbf8] text-[#26382d] transition-colors duration-300 dark:bg-[#0c120e] dark:text-[#f0f4f0]">
      <OwnerSidebar />

      <main className="flex-1 overflow-y-auto px-5 py-8 sm:px-8 lg:px-12">
        <DashboardHeader
          title="Room Types & Inventory Configuration"
          subtitle="Configure room categories, standard capacities, bedding, and base rates."
          eyebrow="Room Management"
          actionText="+ Add Room Type"
          onActionClick={handleOpenAdd}
        />

        {/* Property Selector Bar */}
        <div className="flex items-center gap-3 mb-6 p-4 rounded-2xl border border-[#e9e5dc] bg-white text-xs dark:border-[#2a3c30] dark:bg-[#152019]">
          <span className="font-semibold text-[#757b72] dark:text-[#9aa59d]">
            Filter by Property:
          </span>
          <select
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            className="rounded-xl border border-[#dedbd2] bg-[#fbf9f4] px-3 py-1.5 outline-none font-medium dark:border-[#2d3d32] dark:bg-[#111914]"
          >
            <option value="all">All Properties ({mockOwnerProperties.length})</option>
            {mockOwnerProperties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.city})
              </option>
            ))}
          </select>
        </div>

        {/* Room Types Grid */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredRooms.map((rm) => (
            <div
              key={rm.id}
              className="rounded-3xl border border-[#e9e5dc] bg-white p-6 shadow-xs dark:border-[#2a3c30] dark:bg-[#152019] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#b18a57] dark:text-[#fbbf24]">
                      {rm.propertyName}
                    </span>
                    <h3 className="mt-1 font-serif text-lg font-bold text-[#244b38] dark:text-[#f0f4f0]">
                      {rm.name}
                    </h3>
                  </div>
                  <StatusBadge status={rm.status} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs border-y border-[#eeece6] py-3 dark:border-[#243329]">
                  <div>
                    <span className="text-[10px] text-[#757b72] block">Capacity</span>
                    <strong>{rm.capacity} Guests</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#757b72] block">Beds</span>
                    <strong>{rm.beds}</strong>
                  </div>
                  <div className="mt-1">
                    <span className="text-[10px] text-[#757b72] block">Base Rate</span>
                    <strong className="text-[#244b38] dark:text-[#34d399]">
                      {formatPrice(rm.basePrice)}
                    </strong>
                    <span className="text-[10px] text-[#858f87]"> / night</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-[10px] text-[#757b72] block">Total Units</span>
                    <strong>{rm.totalUnits} Units in Service</strong>
                  </div>
                </div>

                {/* Amenities pills */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {rm.amenities.map((am) => (
                    <span
                      key={am}
                      className="rounded-md bg-[#f6f4ed] px-2 py-0.5 text-[10px] text-[#59645b] dark:bg-[#1b2b20] dark:text-[#a0b0a3]"
                    >
                      {am}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 border-t border-[#eeece6] pt-4 dark:border-[#243329]">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(rm)}
                  className="rounded-xl border border-[#dedbd2] px-3.5 py-1.5 text-xs font-semibold hover:bg-[#f6f4ed] dark:border-[#2d3d32] dark:hover:bg-[#1f2d23]"
                >
                  Edit Configuration
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(rm)}
                  className="rounded-xl border border-[#dedbd2] px-3 py-1.5 text-xs font-semibold text-[#c53030] hover:bg-[#fff5f5] dark:border-[#2d3d32]"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-3xl border border-[#e9e5dc] bg-white p-6 shadow-2xl dark:border-[#2a3c30] dark:bg-[#152019]">
              <div className="flex items-center justify-between pb-3 border-b border-[#eeece6] dark:border-[#243329]">
                <h3 className="font-serif text-xl font-medium text-[#244b38] dark:text-[#f0f4f0]">
                  {editingRoom ? "Edit Room Configuration" : "Add Room Category"}
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
                  <label className="mb-1 block font-semibold">Select Property *</label>
                  <select
                    value={form.propertyId}
                    onChange={(e) => setForm({ ...form, propertyId: e.target.value })}
                    className="w-full rounded-xl border border-[#dedbd2] bg-[#fbf9f4] p-2.5 outline-none dark:border-[#2d3d32] dark:bg-[#111914]"
                  >
                    {mockOwnerProperties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block font-semibold">Room Name *</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Deluxe Sea-View Suite"
                      className="w-full rounded-xl border border-[#dedbd2] bg-[#fbf9f4] p-2.5 outline-none dark:border-[#2d3d32] dark:bg-[#111914]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-semibold">Category Type</label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                      className="w-full rounded-xl border border-[#dedbd2] bg-[#fbf9f4] p-2.5 outline-none dark:border-[#2d3d32] dark:bg-[#111914]"
                    >
                      <option>Standard</option>
                      <option>Deluxe</option>
                      <option>Heritage Suite</option>
                      <option>Villa</option>
                      <option>Presidential</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block font-semibold">Max Guests</label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={form.capacity}
                      onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                      className="w-full rounded-xl border border-[#dedbd2] bg-[#fbf9f4] p-2.5 outline-none dark:border-[#2d3d32] dark:bg-[#111914]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-semibold">Base Rate (INR) *</label>
                    <input
                      type="number"
                      required
                      min={500}
                      value={form.basePrice}
                      onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                      className="w-full rounded-xl border border-[#dedbd2] bg-[#fbf9f4] p-2.5 outline-none dark:border-[#2d3d32] dark:bg-[#111914]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-semibold">Total Units *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={form.totalUnits}
                      onChange={(e) => setForm({ ...form, totalUnits: e.target.value })}
                      className="w-full rounded-xl border border-[#dedbd2] bg-[#fbf9f4] p-2.5 outline-none dark:border-[#2d3d32] dark:bg-[#111914]"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block font-semibold">Bedding Setup</label>
                    <input
                      type="text"
                      value={form.beds}
                      onChange={(e) => setForm({ ...form, beds: e.target.value })}
                      placeholder="e.g. 1 King Bed"
                      className="w-full rounded-xl border border-[#dedbd2] bg-[#fbf9f4] p-2.5 outline-none dark:border-[#2d3d32] dark:bg-[#111914]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-semibold">Room Size</label>
                    <input
                      type="text"
                      value={form.size}
                      onChange={(e) => setForm({ ...form, size: e.target.value })}
                      placeholder="e.g. 350 sq ft"
                      className="w-full rounded-xl border border-[#dedbd2] bg-[#fbf9f4] p-2.5 outline-none dark:border-[#2d3d32] dark:bg-[#111914]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-semibold">Amenities (comma-separated)</label>
                  <input
                    type="text"
                    value={form.amenities}
                    onChange={(e) => setForm({ ...form, amenities: e.target.value })}
                    className="w-full rounded-xl border border-[#dedbd2] bg-[#fbf9f4] p-2.5 outline-none dark:border-[#2d3d32] dark:bg-[#111914]"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-[#eeece6] dark:border-[#243329]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl border border-[#dedbd2] px-4 py-2.5 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#244b38] px-5 py-2.5 font-semibold text-white hover:bg-[#193829] dark:bg-[#34d399] dark:text-[#0b120e]"
                  >
                    {editingRoom ? "Save Room" : "Create Room"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <ConfirmActionModal
          isOpen={!!deleteTarget}
          title="Delete Room Category?"
          message={`Are you sure you want to delete ${deleteTarget?.name}? This action removes it from active inventory.`}
          confirmText="Delete Room"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </main>
    </div>
  );
}

