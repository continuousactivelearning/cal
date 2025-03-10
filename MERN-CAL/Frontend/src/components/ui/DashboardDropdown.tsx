import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLogoutMutation } from '@/store/apiService'
import { logoutState } from '@/store/slices/authSlice'
import Cookies from 'js-cookie'
import { useDispatch, useSelector } from 'react-redux' // ✅ Added useSelector
import { useNavigate,useLocation } from 'react-router-dom'
import { useEffect } from 'react'

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
    <div className="flex items-center gap-4"> {/* ✅ Added flex container to align elements */}
      {/* ✅ Display Streak */}
      {location.pathname === '/content-scroll-view' &&(<span className="text-gray-600 text-sm">🔥 Streak: {streak}</span>
)}

      {/* ✅ Moved the Menu button to the left */}
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
            <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
