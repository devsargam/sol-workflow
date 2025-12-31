"use client";

import React, { useState, useEffect } from "react";
import type { Node } from "@xyflow/react";

interface NodeConfigPanelProps {
  node: Node;
  onUpdate: (nodeId: string, data: any) => void;
  onClose: () => void;
}

export function NodeConfigPanel({ node, onUpdate, onClose }: NodeConfigPanelProps) {
  const [formData, setFormData] = useState(node.data);

  useEffect(() => {
    setFormData(node.data);
  }, [node]);

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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Trigger Type</label>
        <select
          value={formData.type || "balance_change"}
          onChange={(e) => setFormData({ ...formData, type: e.target.value, config: {} })}
          className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
        >
          <option value="balance_change">Balance Change</option>
          <option value="token_receipt">Token Receipt</option>
          <option value="nft_receipt">NFT Receipt</option>
          <option value="transaction_status">Transaction Status</option>
          <option value="program_log">Program Log</option>
        </select>
      </div>

      {formData.type === "balance_change" && (
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

      {formData.type === "token_receipt" && (
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

      {formData.type === "nft_receipt" && (
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
            <label htmlFor="verifiedOnly" className="text-sm">Verified Collections Only</label>
          </div>
        </>
      )}

      {formData.type === "program_log" && (
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
    </div>
  );
}

// Filter Configuration
function FilterConfig({ formData, setFormData }: any) {
  const conditions = formData.conditions || [];

  const addCondition = () => {
    setFormData({
      ...formData,
      conditions: [
        ...conditions,
        { field: "", operator: "equals", value: "" },
      ],
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Action Type</label>
        <select
          value={formData.type || "send_sol"}
          onChange={(e) => setFormData({ ...formData, type: e.target.value, config: {} })}
          className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
        >
          <option value="send_sol">Send SOL</option>
          <option value="send_spl_token">Send SPL Token</option>
          <option value="call_program">Call Program</option>
        </select>
      </div>

      {formData.type === "send_sol" && (
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

      {formData.type === "send_spl_token" && (
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

      {formData.type === "call_program" && (
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
    </div>
  );
}

// Notify Configuration
function NotifyConfig({ formData, setFormData }: any) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Notification Type</label>
        <select
          value={formData.type || "discord"}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
        >
          <option value="discord">Discord</option>
          <option value="slack">Slack (Coming Soon)</option>
          <option value="email">Email (Coming Soon)</option>
          <option value="webhook">Custom Webhook</option>
        </select>
      </div>

      {(formData.type === "discord" || formData.type === "webhook") && (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">Webhook URL</label>
            <input
              type="url"
              value={formData.webhookUrl || ""}
              onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="https://discord.com/api/webhooks/..."
              required
            />
            {formData.type === "discord" && (
              <p className="text-xs text-neutral-500 mt-1">
                Get from: Server Settings → Integrations → Webhooks
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Message Template</label>
            <select
              value={formData.template || "default"}
              onChange={(e) => setFormData({ ...formData, template: e.target.value })}
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
    </div>
  );
}