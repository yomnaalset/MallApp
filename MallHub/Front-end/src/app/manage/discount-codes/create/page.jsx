import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { DiscountCodeService } from "@/services/discount-code-service"

export default function CreateDiscountCodePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    code: "",
    value: "",
    description: "",
    is_active: true,
    expiration_date: null,
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleCheckboxChange = (checked) => {
    setFormData({ ...formData, is_active: checked })
  }

  const handleDateChange = (e) => {
    const { value } = e.target
    if (value) {
      // Set the time to end of day (23:59:59)
      const dateWithTime = new Date(value)
      dateWithTime.setHours(23, 59, 59)
      setFormData({ ...formData, expiration_date: dateWithTime.toISOString() })
    } else {
      setFormData({ ...formData, expiration_date: null })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate data
    if (!formData.code.trim()) {
      toast.error("Discount code is required")
      return
    }
    
    if (!formData.value || isNaN(formData.value) || formData.value <= 0 || formData.value > 100) {
      toast.error("Discount value must be between 0 and 100")
      return
    }

    try {
      setLoading(true)
      await DiscountCodeService.createDiscountCode(formData)
      toast.success("Discount code created successfully")
      navigate("/manage/discount-codes")
    } catch (error) {
      toast.error("Failed to create discount code")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Create Discount Code</h1>
        <Button variant="outline" onClick={() => navigate("/manage/discount-codes")}>
          Cancel
        </Button>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="code">Discount Code</Label>
              <Input
                id="code"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="e.g. SUMMER50"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">Discount Value (%)</Label>
              <Input
                id="value"
                name="value"
                type="number"
                min="0"
                max="100"
                value={formData.value}
                onChange={handleChange}
                placeholder="e.g. 50"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiration_date">Expiration Date</Label>
            <Input
              id="expiration_date"
              name="expiration_date"
              type="date"
              onChange={handleDateChange}
              min={new Date().toISOString().split('T')[0]}
              className="w-full"
            />
            <p className="text-sm text-gray-500">
              Leave empty for no expiration date
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add a description for this discount code"
              rows={4}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={handleCheckboxChange}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Discount Code"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
} 