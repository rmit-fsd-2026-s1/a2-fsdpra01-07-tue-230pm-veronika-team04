"use client";

import {
  Avatar,
  Button,
} from "@chakra-ui/react";
import {
  MenuContent,
  MenuItem,
  MenuRoot,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";
import {
  DialogActionTrigger,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog";
import { toaster } from "@/components/ui/toaster";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import { useState } from "react";

export default function ProfileMenu() {
  const router = useRouter();
  const { currentUser, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const displayName = currentUser ? currentUser.name : "User";

  const handleConfirmLogout = async () => {
    await logout();

    toaster.create({
      title: "Logged out.",
      description: "You have been successfully logged out.",
      type: "success",
      duration: 2000,
    });
    setIsOpen(false);
    router.push("/");
  };

  return (
    <>
    <div style={{ display: "inline-block" }}>
      <MenuRoot positioning={{ placement: "bottom-end", gutter: 8 }}>
        <MenuTrigger asChild>
          <Button 
            variant="ghost" 
            rounded="full" 
            boxSize="50px" 
            padding="0"
            minW="40px"
            _hover={{ bg: "#d3e6f3" }}
            _focus={{ outline: "none", boxShadow: "none" }} 
            _focusVisible={{ outline: "none", boxShadow: "none" }}
          >
            <Avatar.Root size="md" colorPalette="blue">
              <Avatar.Fallback name={displayName} color="dark-blue" />
            </Avatar.Root>
          </Button>
        </MenuTrigger>
        <MenuContent
          bg="white"
          borderColor="gray.200"
          boxShadow="md"
          minW="180px"
          zIndex={1400}
        >
          <MenuItem value="profile" onClick={() => router.push("/profile")}>
            My Profile
          </MenuItem>
          <MenuItem value="notifications" onClick={() => router.push("/notifications")}>
            Notifications
          </MenuItem>
          <MenuItem value="settings" onClick={() => router.push("/settings")}>
            Settings
          </MenuItem>
          <MenuSeparator color="gray.300" />
          <MenuItem value="logout" onClick={() => setIsOpen(true)} color="red.600">
            Logout
          </MenuItem>
        </MenuContent>
      </MenuRoot>

      <DialogRoot
        open={isOpen}
        onOpenChange={(e) => setIsOpen(e.open)}
        placement="center"
        role="alertdialog"
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle fontSize="lg" fontWeight="bold" color="black">
              Confirm Logout
            </DialogTitle>
          </DialogHeader>
          <DialogBody color="black">Are you sure you want to log out?</DialogBody>
          <DialogFooter gap={3}>
            <DialogActionTrigger asChild>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
            </DialogActionTrigger>
            <Button colorPalette="red" onClick={handleConfirmLogout}>
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </div>
    </>
  );
}
