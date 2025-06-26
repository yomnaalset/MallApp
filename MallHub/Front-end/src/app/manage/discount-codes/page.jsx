import { useState, useEffect } from "react"
import { PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Link } from "react-router-dom"
import { DiscountCodeService } from "@/services/discount-code-service"
import { toast } from "sonner"
import { format } from "date-fns"

export default function DiscountCodesPage() {
  const [discountCodes, setDiscountCodes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDiscountCodes()
  }, [])

  const fetchDiscountCodes = async () => {
    try {
      setLoading(true)
      const data = await DiscountCodeService.getAllDiscountCodes()
      setDiscountCodes(data)
    } catch (error) {
      toast.error("Failed to load discount codes")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this discount code?")) {
      try {
        await DiscountCodeService.deleteDiscountCode(id)
        toast.success("Discount code deleted successfully")
        fetchDiscountCodes()
      } catch (error) {
        toast.error("Failed to delete discount code")
        console.error(error)
      }
    }
  }

  const formatExpirationDate = (dateString) => {
    if (!dateString) return "No expiration"
    return format(new Date(dateString), "PPP")
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Discount Codes</h1>
        <Button asChild>
          <Link to="/manage/discount-codes/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Discount Code
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Value (%)</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {discountCodes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    No discount codes found. Create one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                discountCodes.map((discount) => (
                  <TableRow key={discount.id}>
                    <TableCell className="font-medium">{discount.code}</TableCell>
                    <TableCell>{discount.value}%</TableCell>
                    <TableCell>{discount.description}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          discount.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {discount.is_active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell>{formatExpirationDate(discount.expiration_date)}</TableCell>
                    <TableCell>
                      {new Date(discount.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/manage/discount-codes/${discount.id}`}>
                          Edit
                        </Link>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(discount.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
} 