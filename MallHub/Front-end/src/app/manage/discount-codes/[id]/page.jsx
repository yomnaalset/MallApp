import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { DiscountCodeService } from "@/services/discount-code-service"

export default function EditDiscountCodePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [formData, setFormData] = useState({
    code: "",
    value: "",
    description: "",
    is_active: true,
    expiration_date: null,
  })

  useEffect(() => {
    const fetchDiscountCode = async () => {
      try {
        setFetchLoading(true)
        const data = await DiscountCodeService.getDiscountCodeById(id)
        setFormData(data)
      } catch (error) {
        toast.error("Failed to load discount code")
        console.error(error)
        navigate("/manage/discount-codes")
      } finally {
        setFetchLoading(false)
      }
    }

    fetchDiscountCode()
  }, [id, navigate])

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

  const formatDateForInput = (dateString) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toISOString().split('T')[0]
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
      await DiscountCodeService.updateDiscountCode(id, formData)
      toast.success("Discount code updated successfully")
      navigate("/manage/discount-codes")
    } catch (error) {
      toast.error("Failed to update discount code")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit Discount Code</h1>
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
              value={formatDateForInput(formData.expiration_date)}
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
              {loading ? "Updating..." : "Update Discount Code"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
} 