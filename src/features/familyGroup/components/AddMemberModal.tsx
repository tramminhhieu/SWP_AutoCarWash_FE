import { useState } from "react";
import { Car, Check, Search, UserPlus, UserRound } from "lucide-react";
import Modal from "../../../components/ui/Modal";
import { getApiErrorInfo } from "../../../lib/axiosClient";
import { addFamilyMember, searchInvitedCustomer } from "../api/familyGroupApi";
import type { SearchInvitedCustomerResponse } from "../types/familyGroup";
import { getFamilyGroupErrorMessage } from "../utils/familyGroupErrorMessages";

const labelClass = "mb-1.5 block text-label-md text-on-surface-variant";
const errorTextClass = "mt-1.5 text-label-sm text-error";
const inputClass = (hasError: boolean) =>
  `w-full rounded-lg border px-4 py-2.5 text-body-md text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/60 ${
    hasError ? "border-error" : "border-outline-variant focus:border-primary"
  }`;

// API-17-02: AC01 - chỉ tra cứu CHÍNH XÁC 1 khách hàng theo SĐT/email, không cho liệt kê
// toàn bộ khách hàng (privacy leak).
export default function AddMemberModal({
  familyGroupId,
  onClose,
  onAdded,
}: {
  familyGroupId: number;
  onClose: () => void;
  onAdded: (memberName: string) => void;
}) {
  const [identifier, setIdentifier] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [foundCustomer, setFoundCustomer] =
    useState<SearchInvitedCustomerResponse | null>(null);

  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [vehicleError, setVehicleError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);

    const trimmed = identifier.trim();
    if (!trimmed) {
      setSearchError("Please enter a phone number or email to search.");
      return;
    }

    setIsSearching(true);
    try {
      const result = await searchInvitedCustomer(trimmed);
      setFoundCustomer(result);
    } catch (err) {
      const { errorCode, message } = getApiErrorInfo(err);
      setSearchError(getFamilyGroupErrorMessage(errorCode, message));
    } finally {
      setIsSearching(false);
    }
  };

  // Quay lại bước tìm kiếm - vd tìm nhầm người, hoặc muốn đổi SĐT/email khác.
  const handleChangeCustomer = () => {
    setFoundCustomer(null);
    setSelectedVehicleId(null);
    setVehicleError(null);
    setAddError(null);
  };

  const handleConfirmAdd = async () => {
    if (!foundCustomer) return;
    setAddError(null);

    if (selectedVehicleId === null) {
      setVehicleError("Please select a vehicle to activate their membership.");
      return;
    }

    setIsAdding(true);
    try {
      await addFamilyMember({
        familyGroupId,
        invitedCustomerId: foundCustomer.customerId,
        vehicleId: selectedVehicleId,
      });
      onAdded(foundCustomer.fullName);
    } catch (err) {
      const { errorCode, message } = getApiErrorInfo(err);
      setAddError(getFamilyGroupErrorMessage(errorCode, message));
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} variant="custom">
      <div className="w-full text-left">
        <p className="font-heading text-body-lg font-bold text-on-surface">
          Add Member
        </p>

        {!foundCustomer ? (
          <>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Enter the phone number or email of an existing customer to find them.
            </p>

            <form onSubmit={handleSearch} className="mt-5">
              <label className={labelClass}>Phone or Email</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setSearchError(null);
                  }}
                  placeholder="e.g. emma.w@example.com"
                  className={inputClass(!!searchError)}
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-label-md font-semibold text-on-primary hover:opacity-90 disabled:opacity-50"
                >
                  <Search size={16} />
                  {isSearching ? "Searching..." : "Search"}
                </button>
              </div>
              {searchError && <p className={errorTextClass}>{searchError}</p>}
            </form>
          </>
        ) : (
          <>
            <div className="mt-5 flex items-center gap-3 rounded-xl border border-outline-variant bg-surface-container p-3.5">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <UserRound size={20} className="text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-body-md font-semibold text-on-surface">
                  {foundCustomer.fullName}
                </p>
                <p className="truncate text-label-sm text-on-surface-variant">
                  {foundCustomer.email} · {foundCustomer.phone}
                </p>
              </div>
              <button
                type="button"
                onClick={handleChangeCustomer}
                disabled={isAdding}
                className="shrink-0 text-label-sm font-semibold text-primary hover:opacity-80 disabled:opacity-50"
              >
                Change
              </button>
            </div>

            <div className="mt-5">
              <p className="mb-3 text-label-md text-on-surface-variant">
                Select Their Vehicle
              </p>

              {foundCustomer.vehicles.length === 0 ? (
                <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 text-center text-body-md text-on-surface-variant">
                  This customer has no vehicles registered yet.
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {foundCustomer.vehicles.map((v) => {
                    const isSelected = selectedVehicleId === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setSelectedVehicleId(v.id);
                          setVehicleError(null);
                        }}
                        className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-outline-variant bg-surface-container-lowest hover:border-primary/40"
                        }`}
                      >
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-primary/10 bg-primary/5">
                          <Car size={20} className="text-primary/60" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-body-md font-semibold text-on-surface">
                            {v.licensePlate}
                          </p>
                          <p className="text-label-sm text-on-surface-variant">
                            {v.brandName}
                            {v.color ? ` · ${v.color}` : ""}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary">
                            <Check size={14} className="text-on-primary" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
              {vehicleError && <p className={errorTextClass}>{vehicleError}</p>}
            </div>

            {addError && <p className={`${errorTextClass} mt-4`}>{addError}</p>}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isAdding}
                className="flex-1 rounded-lg border border-secondary px-6 py-3 text-body-md font-semibold text-secondary hover:bg-secondary/5 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAdd}
                disabled={isAdding || foundCustomer.vehicles.length === 0}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-body-md font-semibold text-on-primary hover:opacity-90 disabled:opacity-50"
              >
                <UserPlus size={16} />
                {isAdding ? "Adding..." : "Confirm Add"}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
