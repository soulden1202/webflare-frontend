import { useState, useRef, useEffect } from "react";
import {
  MoreHorizontal,
  Trash,
  Edit,
  Copy,
  Plus,
  X,
  GripVertical,
} from "lucide-react";

import {
  fetchAllItems,
  createItem,
  updateItem,
  deleteItem,
} from "../api/service";
import { ErrorSnackbar } from "./SnackBar";

export default function Table() {
  const [selectedItems, setSelectedItems] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [allSelected, setAllSelected] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [currentItem, setCurrentItem] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    consignor: "",
    estimate: {
      high: 0,
      low: 0,
    },
  });
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItemId, setDragOverItemId] = useState(null);
  const [error, setError] = useState(null);
  const [operation, setOperation] = useState(null);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [errors, setErrors] = useState({});

  const [items, setItems] = useState([]);

  const [lowTotal, setLowTotal] = useState(0);
  const [highTotal, setHighTotal] = useState(0);

  useEffect(() => {
    async function fetchData() {
      const data = await fetchAllItems();
      setItems(data);
    }

    fetchData();
    console.log(items);
  }, []);

  const getOperationFunction = () => {
    switch (operation) {
      case "create":
        return handleSubmit;
      case "update":
        return handleSubmit;
      case "delete":
        return deleteItem;
      default:
        return () => {};
    }
  };

  const toggleDropdown = (id) => {
    setDropdownOpen(dropdownOpen === id ? null : id);
  };

  const toggleSelectItem = (id) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter((item) => item !== id));
      setAllSelected(false);
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map((item) => item.id));
    }
    setAllSelected(!allSelected);
  };

  const openAddModal = () => {
    setModalMode("add");
    setFormData({
      title: "",
      description: "",
      consignor: "",
      estimate: {
        high: 0,
        low: 0,
      },
    });
    setShowModal(true);
  };

  const openEditModal = (id) => {
    const itemToEdit = items.find((item) => item.id === id);
    setCurrentItem(itemToEdit);
    setFormData({
      title: itemToEdit.title,
      description: itemToEdit.description,
      consignor: itemToEdit.consignor,
      estimate: {
        low: itemToEdit.estimate.low,
        high: itemToEdit.estimate.high,
      },
    });
    setModalMode("edit");
    setShowModal(true);
    setDropdownOpen(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");

      console.log(parent, child);
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async () => {
    setErrors({});

    // Validate low < high
    const lowValue = parseFloat(formData.estimate.low);
    const highValue = parseFloat(formData.estimate.high);

    if (isNaN(lowValue) || isNaN(highValue)) {
      setErrors({
        estimate: "Both low and high estimates must be valid numbers",
      });
      return; // Prevent submission
    }

    if (lowValue >= highValue) {
      setErrors({
        estimate: "Low estimate must be smaller than high estimate",
      });
      return; // Prevent submission
    }

    if (modalMode === "add") {
      setOperation("create");
      setError(null);
      console.log(formData);
      const newId = Math.max(...items.map((item) => item.id), 0) + 1;
      const newSaleNumber =
        Math.max(...items.map((item) => item.saleNumber), 100) + 1 || 1;
      const newItem = {
        id: newId,
        saleNumber: newSaleNumber,
        ...formData,
      };
      setItems([...items, newItem]);
      await createItem(newItem)
        .then((res) => {
          const newItemReturn = res;
          setItems([...items, newItemReturn]);
        })
        .catch((err) => {
          setError(err.message);
          setShowSnackbar(true);
        });
    } else {
      setOperation("update");
      setError(null);
      setItems(
        items.map((item) => {
          if (item.id === currentItem.id) {
            return {
              ...item,
              ...formData,
            };
          }
          return item;
        })
      );

      await updateItem(currentItem.id, formData)
        .then((res) => {
          setItems(
            items.map((item) => {
              if (item.id === res.id) {
                return {
                  ...item,
                  ...res,
                };
              }
              return item;
            })
          );
        })
        .catch((err) => {
          setError(err.message);
          setShowSnackbar(true);
          setItems(
            items.map((item) => {
              if (item.id === currentItem.id) {
                return {
                  ...item,
                  ...currentItem,
                };
              }
              return item;
            })
          );
        });
    }
    setShowModal(false);
  };

  const duplicateItem = async (id) => {
    const itemToDuplicate = items.find((item) => item.id === id);
    const newId = Math.max(...items.map((item) => item.id)) + 1;
    const newSaleNumber = Math.max(...items.map((item) => item.saleNumber)) + 1;
    const duplicatedItem = {
      ...itemToDuplicate,
      id: newId,
      saleNumber: newSaleNumber,
      title: `${itemToDuplicate.title}`,
    };
    setItems([...items, duplicatedItem]);
    setDropdownOpen(null);

    await createItem(duplicatedItem)
      .then((res) => {
        const newItemReturn = res;
        setItems([...items, newItemReturn]);
      })
      .catch((err) => {
        setError(err.message);
        setShowSnackbar(true);
      });
  };

  const deleteItemAction = async (id) => {
    setItems(items.filter((item) => item.id !== id));
    setSelectedItems(selectedItems.filter((itemId) => itemId !== id));

    await deleteItem(id).catch((err) => {
      setOperation("delete");
      setError(err);
      setShowSnackbar(true);
    });
    setDropdownOpen(null);
  };

  const bulkDelete = () => {
    const itemsToDelete = items.filter((item) =>
      selectedItems.includes(item.id)
    );

    itemsToDelete.forEach((i) => {
      deleteItemAction(i.id);
    });
    setItems(items.filter((item) => !selectedItems.includes(item.id)));
    setSelectedItems([]);
    setAllSelected(false);
  };

  const bulkDuplicate = async () => {
    const itemsToDuplicate = items.filter((item) =>
      selectedItems.includes(item.id)
    );

    let lastSaleNumber = Math.max(...items.map((item) => item.saleNumber));

    const duplicatedItems = itemsToDuplicate.map((item) => {
      lastSaleNumber += 1;
      return {
        ...item,

        saleNumber: lastSaleNumber,
        title: `${item.title}`,
      };
    });

    setItems([...items, ...duplicatedItems]);
    let itemDataReturn = [];
    for (let i = 0; i < duplicatedItems.length; i++) {
      await createItem(duplicatedItems[i])
        .then((res) => {
          const newItemReturn = res;
          itemDataReturn.push(newItemReturn);
        })
        .catch((err) => {
          setError(err.message);
          setShowSnackbar(true);
        });
    }
    setItems([...items, ...itemDataReturn]);
  };

  // Drag and drop handlers
  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    // This adds a custom drag ghost image
    if (e.dataTransfer) {
      const dragGhost = document.createElement("div");
      dragGhost.classList.add("drag-ghost");
      dragGhost.innerHTML = `<div class="p-2 bg-blue-100 border border-blue-300 rounded">${item.title}</div>`;
      document.body.appendChild(dragGhost);
      e.dataTransfer.setDragImage(dragGhost, 20, 20);

      // Clean up the ghost element after the drag operation
      setTimeout(() => {
        document.body.removeChild(dragGhost);
      }, 0);
    }
  };

  const handleDragOver = (e, id) => {
    e.preventDefault();
    setDragOverItemId(id);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItemId(null);
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();

    if (!draggedItem || draggedItem.id === targetId) {
      return;
    }

    // Create a copy of the items array
    const itemsCopy = [...items];

    // Find the indices
    const draggedIndex = itemsCopy.findIndex(
      (item) => item.id === draggedItem.id
    );
    const targetIndex = itemsCopy.findIndex((item) => item.id === targetId);

    // Remove the dragged item
    const [removed] = itemsCopy.splice(draggedIndex, 1);

    // Insert at target position
    itemsCopy.splice(targetIndex, 0, removed);

    // Update the state
    setItems(itemsCopy);
    setDraggedItem(null);
    setDragOverItemId(null);
  };

  const handleCloseSnackbar = () => {
    setShowSnackbar(false);
  };

  useEffect(() => {
    // Auto-hide snackbar after 5 seconds
    let timer;
    if (showSnackbar) {
      timer = setTimeout(() => {
        setShowSnackbar(false);
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [showSnackbar]);
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">Inventory Management</h1>
          <span>
            Total Estimate: $
            {items.reduce((sum, item) => sum + Number(item.estimate.low), 0)} -
            ${items.reduce((sum, item) => sum + Number(item.estimate.high), 0)}
          </span>
          <span>Total Items: {items.length}</span>
        </div>
        <div className="flex space-x-4">
          {selectedItems.length > 0 && (
            <div className="flex space-x-2">
              <button
                onClick={bulkDelete}
                className="px-3 py-2 bg-red-600 text-white rounded flex items-center"
              >
                <Trash size={16} className="mr-1" />
                Delete Selected
              </button>
              <button
                onClick={bulkDuplicate}
                className="px-3 py-2 bg-blue-600 text-white rounded flex items-center"
              >
                <Copy size={16} className="mr-1" />
                Duplicate Selected
              </button>
            </div>
          )}
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-green-600 text-white rounded flex items-center"
          >
            <Plus size={16} className="mr-1" />
            Add New Loot
          </button>
        </div>
      </div>

      <div className="relative bg-white rounded-lg shadow">
        <table className="w-full table-auto">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left w-8"></th>{" "}
              {/* Drag handle column */}
              <th className="px-4 py-3 text-left">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4"
                  />
                </div>
              </th>
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Sale #</th>
              <th className="px-4 py-3 text-left">Title</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-left">Consignor</th>
              <th className="px-4 py-3 text-left">Estimate</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className={`border-t hover:bg-gray-50 ${
                  dragOverItemId === item.id ? "bg-blue-50" : ""
                }`}
                draggable="true"
                onDragStart={(e) => handleDragStart(e, item)}
                onDragOver={(e) => handleDragOver(e, item.id)}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, item.id)}
              >
                <td className="px-2 py-3 cursor-move">
                  <GripVertical size={16} className="text-gray-400" />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => toggleSelectItem(item.id)}
                    className="w-4 h-4"
                  />
                </td>
                <td className="px-4 py-3">{item.id}</td>
                <td className="px-4 py-3">{item.saleNumber}</td>
                <td className="px-4 py-3">{item.title}</td>
                <td className="px-4 py-3 max-w-xs truncate">
                  {item.description}
                </td>
                <td className="px-4 py-3">{item.consignor}</td>
                <td className="px-4 py-3">
                  ${item.estimate.low} - ${item.estimate.high}
                </td>
                <td className="px-4 py-3 relative">
                  <button
                    onClick={() => toggleDropdown(item.id)}
                    className="p-1 rounded-full hover:bg-gray-200"
                  >
                    <MoreHorizontal size={20} />
                  </button>

                  {dropdownOpen === item.id && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border">
                      <div className="py-1">
                        <button
                          className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center"
                          onClick={() => openEditModal(item.id)}
                        >
                          <Edit size={16} className="mr-2" />
                          Modify
                        </button>
                        <button
                          className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center"
                          onClick={() => deleteItemAction(item.id)}
                        >
                          <Trash size={16} className="mr-2" />
                          Delete
                        </button>
                        <button
                          className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center"
                          onClick={() => duplicateItem(item.id)}
                        >
                          <Copy size={16} className="mr-2" />
                          Duplicate
                        </button>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        {items.length} items total • {selectedItems.length} selected
        {draggedItem && (
          <span className="ml-2">• Dragging: {draggedItem.title}</span>
        )}
      </div>

      {/* Modal for Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {modalMode === "add" ? "Add New Loot" : "Modify Item"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
            >
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="title"
                >
                  Title
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>

              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="description"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows="3"
                  required
                />
              </div>

              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="consignor"
                >
                  Consignor
                </label>
                <input
                  id="consignor"
                  name="consignor"
                  type="text"
                  value={formData.consignor}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>

              <div className="mb-6">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="estimate"
                >
                  Estimate
                </label>

                <div className="flex flex-row gap-2">
                  <div className="flex flex-row gap-2 items-center">
                    <span>Low:</span>
                    <input
                      id="estimate"
                      name="estimate.low"
                      type="text"
                      value={formData.estimate.low}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      placeholder="0"
                      required
                    />
                  </div>

                  <div className="flex flex-row gap-2 items-center">
                    <span>High:</span>
                    <input
                      id="estimate"
                      name="estimate.high"
                      type="text"
                      value={formData.estimate.high}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      placeholder="0"
                      required
                    />
                  </div>
                </div>
              </div>
              {errors.estimate && (
                <p className="text-red-500 text-xs italic mt-1">
                  {errors.estimate}
                </p>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="mr-2 px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  {modalMode === "add" ? "Add Item" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ErrorSnackbar
        message={error || ""}
        operation={operation}
        operationAction={getOperationFunction()}
        onClose={handleCloseSnackbar}
        isVisible={showSnackbar && error !== null}
      />
    </div>
  );
}
