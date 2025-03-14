import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLogoutMutation } from '@/store/apiService'
import { logoutState } from '@/store/slices/authSlice'
import Cookies from 'js-cookie'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Flame } from 'lucide-react' // 🔥 Import aesthetic icon

export function DashboardDropdown() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const location = useLocation()
  const name = Cookies.get('user_name')
  const [logout] = useLogoutMutation()

  // ✅ Fetch streak from Redux store
  const streak = useSelector((state) => state.streak.sectionstreak)

  const handleLogout = async () => {
    try {
      await logout().unwrap()
    } catch (err) {
      console.error('Logout failed:', err)
    } finally {
      dispatch(logoutState())
      navigate('/login')
    }
  }

  return (
    <div className="flex items-center gap-4"> {/* ✅ Flex container for alignment */}
      
      {/* ✅ Stylish Streak Display */}
      {location.pathname === '/content-scroll-view' && (
        <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-lg shadow-sm">
          <Flame className="w-4 h-4 text-orange-500" /> {/* 🔥 Aesthetic fire icon */}
          <span className="text-sm text-gray-700">
            {`Streak: ${streak?streak:0}`} {/* ✅ Handles empty streak */}
          </span>
        </div>
      )}

      {/* ✅ Menu Button */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>Menu</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/')}>
            Dashboard
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/analytics')}>
            Analytics
          </DropdownMenuItem>
          <DropdownMenuItem disabled>Admin</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
