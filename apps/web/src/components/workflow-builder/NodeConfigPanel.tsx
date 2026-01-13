"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { Node } from "@xyflow/react";

interface NodeConfigPanelProps {
  node: Node;
  onUpdate: (nodeId: string, data: any) => void;
  onClose: () => void;
}

export function NodeConfigPanel({ node, onUpdate, onClose }: NodeConfigPanelProps) {
  const normalizeFormData = useCallback(
    (data: any) => {
      const normalized = { ...data };

      if (node.type === "trigger") {
        if (!normalized.type && normalized.triggerType) {
          normalized.type = normalized.triggerType;
        } else if (!normalized.type && !normalized.triggerType) {
          normalized.type = "balance_change";
          normalized.triggerType = "balance_change";
        } else if (normalized.type && !normalized.triggerType) {
          normalized.triggerType = normalized.type;
        }
      }

      if (node.type === "action") {
        if (!normalized.type && normalized.actionType) {
          normalized.type = normalized.actionType;
        } else if (!normalized.type && !normalized.actionType) {
          normalized.type = "send_sol";
          normalized.actionType = "send_sol";
        } else if (normalized.type && !normalized.actionType) {
          normalized.actionType = normalized.type;
        }
      }

      return normalized;
    },
    [node.type]
  );

  const [formData, setFormData] = useState(() => normalizeFormData(node.data));

  useEffect(() => {
    setFormData(normalizeFormData(node.data));
  }, [node, normalizeFormData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(node.id, formData);
    onClose();
  };

  const renderConfigFields = () => {
    switch (node.type) {
      case "trigger":
        return <TriggerConfig formData={formData} setFormData={setFormData} />;
      case "filter":
        return <FilterConfig formData={formData} setFormData={setFormData} />;
      case "action":
        return <ActionConfig formData={formData} setFormData={setFormData} />;
      case "notify":
        return <NotifyConfig formData={formData} setFormData={setFormData} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Configure {node.type}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        {renderConfigFields()}

        <div className="flex gap-3 mt-6 pt-6 border-t border-neutral-200">
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors font-medium"
          >
            Save Changes
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// Trigger Configuration
function TriggerConfig({ formData, setFormData }: any) {
  const triggerType = formData.type || formData.triggerType || "balance_change";

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Trigger Type</label>
        <select
          value={triggerType}
          onChange={(e) =>
            setFormData({
              ...formData,
              type: e.target.value,
              triggerType: e.target.value,
              config: formData.config || {},
            })
          }
          className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
        >
          <option value="balance_change">Balance Change</option>
          <option value="token_receipt">Token Receipt</option>
          <option value="nft_receipt">NFT Receipt</option>
          <option value="transaction_status">Transaction Status</option>
          <option value="program_log">Program Log</option>
          <option value="cron">Scheduled (Cron)</option>
        </select>
      </div>

      {triggerType === "balance_change" && (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">Wallet Address</label>
            <input
              type="text"
              value={formData.config?.address || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  config: { ...formData.config, address: e.target.value },
                })
              }
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Enter Solana address"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Minimum Change (SOL)</label>
            <input
              type="number"
              value={formData.config?.minChange || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  config: { ...formData.config, minChange: parseFloat(e.target.value) },
                })
              }
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="0.1"
              step="0.001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Change Type</label>
            <select
              value={formData.config?.changeType || "any"}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  config: { ...formData.config, changeType: e.target.value },
                })
              }
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="any">Any Change</option>
              <option value="increase">Increase Only</option>
              <option value="decrease">Decrease Only</option>
            </select>
          </div>
        </>
      )}

      {triggerType === "token_receipt" && (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">Token Account</label>
            <input
              type="text"
              value={formData.config?.tokenAccount || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  config: { ...formData.config, tokenAccount: e.target.value },
                })
              }
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Token account address"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Token Mint (optional)</label>
            <input
              type="text"
              value={formData.config?.tokenMint || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  config: { ...formData.config, tokenMint: e.target.value },
                })
              }
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Token mint address"
            />
          </div>
        </>
      )}

      {triggerType === "nft_receipt" && (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">Wallet Address</label>
            <input
              type="text"
              value={formData.config?.walletAddress || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  config: { ...formData.config, walletAddress: e.target.value },
                })
              }
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Wallet address"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Collection Address (optional)</label>
            <input
              type="text"
              value={formData.config?.collectionAddress || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  config: { ...formData.config, collectionAddress: e.target.value },
                })
              }
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Collection address"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="verifiedOnly"
              checked={formData.config?.verifiedOnly || false}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  config: { ...formData.config, verifiedOnly: e.target.checked },
                })
              }
              className="w-4 h-4"
            />
            <label htmlFor="verifiedOnly" className="text-sm">
              Verified Collections Only
            </label>
          </div>
        </>
      )}

      {triggerType === "program_log" && (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">Program ID</label>
            <input
              type="text"
              value={formData.config?.programId || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  config: { ...formData.config, programId: e.target.value },
                })
              }
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Program ID"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Log Pattern (regex)</label>
            <input
              type="text"
              value={formData.config?.logPattern || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  config: { ...formData.config, logPattern: e.target.value },
                })
              }
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder=".*success.*"
            />
          </div>
        </>
      )}

      {triggerType === "cron" && (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">Schedule (Cron Expression)</label>
            <input
              type="text"
              value={formData.config?.schedule || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  config: { ...formData.config, schedule: e.target.value },
                })
              }
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="*/5 * * * *"
              required
            />
            <p className="text-xs text-neutral-500 mt-1">
              Format: minute hour day month weekday (minimum interval: 1 minute)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Quick Presets</label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Every 5 min", value: "*/5 * * * *" },
                { label: "Every 15 min", value: "*/15 * * * *" },
                { label: "Every 30 min", value: "*/30 * * * *" },
                { label: "Hourly", value: "0 * * * *" },
                { label: "Daily 9 AM", value: "0 9 * * *" },
                { label: "Daily Midnight", value: "0 0 * * *" },
                { label: "Weekly Mon", value: "0 0 * * 1" },
              ].map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      config: { ...formData.config, schedule: preset.value },
                    })
                  }
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    formData.config?.schedule === preset.value
                      ? "bg-black text-white"
                      : "bg-neutral-100 hover:bg-neutral-200"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Timezone</label>
            <select
              value={formData.config?.timezone || "UTC"}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  config: { ...formData.config, timezone: e.target.value },
                })
              }
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York (EST/EDT)</option>
              <option value="America/Chicago">America/Chicago (CST/CDT)</option>
              <option value="America/Denver">America/Denver (MST/MDT)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
              <option value="Europe/London">Europe/London (GMT/BST)</option>
              <option value="Europe/Paris">Europe/Paris (CET/CEST)</option>
              <option value="Europe/Berlin">Europe/Berlin (CET/CEST)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
              <option value="Asia/Shanghai">Asia/Shanghai (CST)</option>
              <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
              <option value="Asia/Dubai">Asia/Dubai (GST)</option>
              <option value="Australia/Sydney">Australia/Sydney (AEST/AEDT)</option>
              <option value="Pacific/Auckland">Pacific/Auckland (NZST/NZDT)</option>
            </select>
          </div>

          <div className="p-3 bg-neutral-50 rounded-lg">
            <p className="text-xs text-neutral-600">
              <strong>Cron Expression Guide:</strong>
            </p>
            <div className="mt-2 text-xs text-neutral-500 font-mono space-y-1">
              <div>┌───────────── minute (0-59)</div>
              <div>│ ┌─────────── hour (0-23)</div>
              <div>│ │ ┌───────── day of month (1-31)</div>
              <div>│ │ │ ┌─────── month (1-12)</div>
              <div>│ │ │ │ ┌───── day of week (0-6, Sun-Sat)</div>
              <div>* * * * *</div>
            </div>
            <p className="mt-2 text-xs text-neutral-500">
              Examples: <code>*/5 * * * *</code> = every 5 min, <code>0 9 * * 1-5</code> = 9 AM
              weekdays
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// Filter Configuration
function FilterConfig({ formData, setFormData }: any) {
  const conditions = formData.conditions || [];

  const addCondition = () => {
    setFormData({
      ...formData,
      conditions: [...conditions, { field: "", operator: "equals", value: "" }],
    });
  };

  const removeCondition = (index: number) => {
    setFormData({
      ...formData,
      conditions: conditions.filter((_: any, i: number) => i !== index),
    });
  };

  const updateCondition = (index: number, field: string, value: any) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setFormData({ ...formData, conditions: newConditions });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium">Filter Conditions</label>
        <button
          type="button"
          onClick={addCondition}
          className="px-3 py-1 text-sm bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
        >
          + Add Condition
        </button>
      </div>

      {conditions.length === 0 ? (
        <div className="p-4 bg-neutral-50 rounded-lg text-sm text-neutral-600 text-center">
          No conditions set. All events will pass through.
        </div>
      ) : (
        <div className="space-y-3">
          {conditions.map((condition: any, index: number) => (
            <div key={index} className="p-3 border border-neutral-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Condition {index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeCondition(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <input
                type="text"
                value={condition.field}
                onChange={(e) => updateCondition(index, "field", e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Field name (e.g., amount)"
              />
              <select
                value={condition.operator}
                onChange={(e) => updateCondition(index, "operator", e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="equals">Equals</option>
                <option value="not_equals">Not Equals</option>
                <option value="greater_than">Greater Than</option>
                <option value="less_than">Less Than</option>
                <option value="contains">Contains</option>
                <option value="starts_with">Starts With</option>
                <option value="ends_with">Ends With</option>
              </select>
              <input
                type="text"
                value={condition.value}
                onChange={(e) => updateCondition(index, "value", e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Value"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Action Configuration
function ActionConfig({ formData, setFormData }: any) {
  const actionType = formData.type || formData.actionType || "send_sol";

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Action Type</label>
        <select
          value={actionType}
          onChange={(e) =>
            setFormData({
              ...formData,
              type: e.target.value,
              actionType: e.target.value,
              config: formData.config || {},
            })
          }
          className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
        >
          <option value="send_sol">Send SOL</option>
          <option value="send_spl_token">Send SPL Token</option>
          <option value="call_program">Call Program</option>
          <option value="kalshi_place_order">Kalshi Place Order</option>
          <option value="do_nothing">Do Nothing</option>
        </select>
      </div>

      {actionType === "send_sol" && (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">To Address</label>
            <input
              type="text"
              value={formData.config?.toAddress || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  config: { ...formData.config, toAddress: e.target.value },
                })
              }
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Recipient address"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Amount (SOL)</label>
            <input
              type="number"
              value={(formData.config?.amount || 0) / 1e9}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  config: { ...formData.config, amount: parseFloat(e.target.value) * 1e9 },
                })
              }
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="0.001"
              step="0.000001"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">From Keypair (optional)</label>
            <textarea
              value={formData.config?.fromKeypair || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  config: { ...formData.config, fromKeypair: e.target.value },
                })
              }
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Base58 private key (leave empty for default)"
              rows={2}
            />
          </div>
        </>
      )}

      {actionType === "send_spl_token" && (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">Token Mint</label>
            <input
              type="text"
              value={formData.config?.tokenMint || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  config: { ...formData.config, tokenMint: e.target.value },
                })
              }
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Token mint address"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">From Token Account</label>
            <input
              type="text"
              value={formData.config?.fromTokenAccount || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  config: { ...formData.config, fromTokenAccount: e.target.value },
                })
              }
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Source token account"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">To Token Account</label>
            <input
              type="text"
              value={formData.config?.toTokenAccount || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  config: { ...formData.config, toTokenAccount: e.target.value },
                })
              }
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Destination token account"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Amount</label>
            <input
              type="number"
              value={formData.config?.amount || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  config: { ...formData.config, amount: parseFloat(e.target.value) },
                })
              }
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Token amount"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Decimals</label>
            <input
              type="number"
              value={formData.config?.decimals || 9}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  config: { ...formData.config, decimals: parseInt(e.target.value) },
                })
              }
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="9"
            />
          </div>
        </>
      )}

      {actionType === "call_program" && (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">Program ID</label>
            <input
              type="text"
              value={formData.config?.programId || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  config: { ...formData.config, programId: e.target.value },
                })
              }
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Program ID"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Instruction Name</label>
            <input
              type="text"
              value={formData.config?.instruction || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  config: { ...formData.config, instruction: e.target.value },
                })
              }
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="e.g., transfer"
              required
            />
          </div>
        </>
      )}

      {actionType === "kalshi_place_order" && (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">Market Ticker</label>
            <input
              type="text"
              value={formData.config?.ticker || formData.config?.marketId || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  config: { ...formData.config, ticker: e.target.value, marketId: e.target.value },
                })
              }
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="e.g., NASDAQ-2024-U-5000"
              required
            />
            <p className="text-xs text-neutral-500 mt-1">
              Kalshi market ticker (e.g., NASDAQ-2024-U-5000)
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Side</label>
            <select
              value={formData.config?.side || "yes"}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  config: { ...formData.config, side: e.target.value },
                })
              }
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Action</label>
            <select
              value={formData.config?.action || "buy"}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  config: { ...formData.config, action: e.target.value },
                })
              }
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Count (Contracts)</label>
            <input
              type="number"
              value={formData.config?.count || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  config: { ...formData.config, count: parseInt(e.target.value) || 0 },
                })
              }
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="10"
              min="1"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Price (cents, 1-99)</label>
            <input
              type="number"
              value={formData.config?.price || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  config: { ...formData.config, price: parseInt(e.target.value) || 0 },
                })
              }
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="60"
              min="1"
              max="99"
              required
            />
            <p className="text-xs text-neutral-500 mt-1">
              Price in cents (1-99). Cost = (price × count) / 100
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Order Type</label>
            <select
              value={formData.config?.type || "limit"}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  config: { ...formData.config, type: e.target.value },
                })
              }
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="limit">Limit</option>
              <option value="market">Market</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Max Cost ($) - Optional</label>
            <input
              type="number"
              value={formData.config?.maxCost || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  config: { ...formData.config, maxCost: parseFloat(e.target.value) || undefined },
                })
              }
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="10.00"
              step="0.01"
              min="0"
            />
            <p className="text-xs text-neutral-500 mt-1">
              Safety limit: Order will fail if cost exceeds this
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Max Position Size - Optional</label>
            <input
              type="number"
              value={formData.config?.maxPositionSize || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  config: {
                    ...formData.config,
                    maxPositionSize: parseInt(e.target.value) || undefined,
                  },
                })
              }
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="100"
              min="1"
            />
            <p className="text-xs text-neutral-500 mt-1">
              Maximum contracts to hold for this market
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// Notify Configuration
function NotifyConfig({ formData, setFormData }: any) {
  const isMultipleMode =
    formData.notifications &&
    Array.isArray(formData.notifications) &&
    formData.notifications.length > 0;
  const notifications = isMultipleMode
    ? formData.notifications
    : formData.notifyType || formData.type
    ? [
        {
          notifyType: formData.notifyType || formData.type || "discord",
          webhookUrl: formData.webhookUrl,
          telegramBotToken: formData.telegramBotToken,
          telegramChatId: formData.telegramChatId,
          telegramParseMode: formData.telegramParseMode,
          telegramDisableWebPreview: formData.telegramDisableWebPreview,
          template: formData.template || "default",
          customMessage: formData.customMessage,
        },
      ]
    : [];

  const updateNotifications = (newNotifications: any[]) => {
    if (newNotifications.length === 0) {
      setFormData({
        ...formData,
        notifications: undefined,
        notifyType: undefined,
        type: undefined,
        webhookUrl: undefined,
        telegramBotToken: undefined,
        telegramChatId: undefined,
        telegramParseMode: undefined,
        telegramDisableWebPreview: undefined,
        template: undefined,
        customMessage: undefined,
      });
    } else if (newNotifications.length === 1) {
      const single = newNotifications[0];
      setFormData({
        ...formData,
        notifications: undefined,
        notifyType: single.notifyType,
        type: single.notifyType,
        webhookUrl: single.webhookUrl,
        telegramBotToken: single.telegramBotToken,
        telegramChatId: single.telegramChatId,
        telegramParseMode: single.telegramParseMode,
        telegramDisableWebPreview: single.telegramDisableWebPreview,
        template: single.template,
        customMessage: single.customMessage,
      });
    } else {
      setFormData({
        ...formData,
        notifications: newNotifications,
        notifyType: undefined,
        type: undefined,
        webhookUrl: undefined,
        telegramBotToken: undefined,
        telegramChatId: undefined,
        telegramParseMode: undefined,
        telegramDisableWebPreview: undefined,
        template: undefined,
        customMessage: undefined,
      });
    }
  };

  const addNotification = () => {
    const newNotifications = [
      ...notifications,
      {
        notifyType: "discord",
        template: "default",
      },
    ];
    updateNotifications(newNotifications);
  };

  const removeNotification = (index: number) => {
    const newNotifications = notifications.filter((_: any, i: number) => i !== index);
    updateNotifications(newNotifications);
  };

  const updateNotification = (index: number, updatedNotification: any) => {
    const newNotifications = [...notifications];
    newNotifications[index] = updatedNotification;
    updateNotifications(newNotifications);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium">Notifications</label>
        <button
          type="button"
          onClick={addNotification}
          className="px-3 py-1.5 text-sm bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors"
        >
          + Add Notification
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="text-sm text-neutral-500 text-center py-4">
          No notifications configured. Click "Add Notification" to get started.
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification: any, index: number) => (
            <div
              key={index}
              className="p-4 border border-neutral-200 rounded-lg space-y-3 bg-neutral-50"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Notification {index + 1}</h4>
                {notifications.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeNotification(index)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <select
                  value={notification.notifyType || "discord"}
                  onChange={(e) => {
                    const nextType = e.target.value;
                    const updated = { ...notification, notifyType: nextType };
                    if (nextType === "telegram") {
                      updated.webhookUrl = undefined;
                    } else {
                      updated.telegramBotToken = undefined;
                      updated.telegramChatId = undefined;
                      updated.telegramParseMode = undefined;
                      updated.telegramDisableWebPreview = undefined;
                    }
                    updateNotification(index, updated);
                  }}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="discord">Discord</option>
                  <option value="telegram">Telegram</option>
                  <option value="webhook">Custom Webhook</option>
                </select>
              </div>

              {(notification.notifyType === "discord" || notification.notifyType === "webhook") && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Webhook URL</label>
                    <input
                      type="url"
                      value={notification.webhookUrl || ""}
                      onChange={(e) =>
                        updateNotification(index, { ...notification, webhookUrl: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder="https://discord.com/api/webhooks/..."
                      required
                    />
                    {notification.notifyType === "discord" && (
                      <p className="text-xs text-neutral-500 mt-1">
                        Get from: Server Settings → Integrations → Webhooks
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Message Template</label>
                    <select
                      value={notification.template || "default"}
                      onChange={(e) =>
                        updateNotification(index, { ...notification, template: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    >
                      <option value="default">Default (Auto-select)</option>
                      <option value="success">Success (Green embed)</option>
                      <option value="error">Error (Red embed)</option>
                      <option value="minimal">Minimal (Single line)</option>
                      <option value="detailed">Detailed (Full context)</option>
                    </select>
                  </div>
                </>
              )}

              {notification.notifyType === "telegram" && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Bot Token</label>
                    <input
                      type="password"
                      value={notification.telegramBotToken || ""}
                      onChange={(e) =>
                        updateNotification(index, {
                          ...notification,
                          telegramBotToken: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder="123456:ABC-DEF..."
                      required
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      Create a bot via @BotFather and paste the token here.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Chat ID</label>
                    <input
                      type="text"
                      value={notification.telegramChatId || ""}
                      onChange={(e) =>
                        updateNotification(index, {
                          ...notification,
                          telegramChatId: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder="e.g. 123456789 or -1001234567890"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Parse Mode (optional)</label>
                    <select
                      value={notification.telegramParseMode || ""}
                      onChange={(e) =>
                        updateNotification(index, {
                          ...notification,
                          telegramParseMode: e.target.value || undefined,
                        })
                      }
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    >
                      <option value="">Plain text</option>
                      <option value="Markdown">Markdown</option>
                      <option value="MarkdownV2">MarkdownV2</option>
                      <option value="HTML">HTML</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Message Template</label>
                    <select
                      value={notification.template || "default"}
                      onChange={(e) =>
                        updateNotification(index, { ...notification, template: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    >
                      <option value="default">Default</option>
                      <option value="success">Success</option>
                      <option value="error">Error</option>
                      <option value="minimal">Minimal</option>
                      <option value="detailed">Detailed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Custom Message (optional)
                    </label>
                    <textarea
                      value={notification.customMessage || ""}
                      onChange={(e) =>
                        updateNotification(index, {
                          ...notification,
                          customMessage: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder="This will be prepended to the template"
                      rows={2}
                    />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
