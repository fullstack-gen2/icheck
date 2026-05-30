import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

type  AlertType ={
    btnName: string,
    title: string,
    firstTime: string,
    secondTime: string
}

const AlertDialogDemo = ({btnName,title, firstTime, secondTime}: AlertType) => {
  return (
    <AlertDialog >
      <AlertDialogTrigger asChild>
        <Button className='bg-blue-600 p-5'>{btnName}</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className='font-bold'>{title}</AlertDialogTitle>
          <AlertDialogDescription className='pl-3'>
            Start at: {firstTime} PM
          </AlertDialogDescription>
          <AlertDialogDescription className='pl-3'>
            End at: {secondTime} PM
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>
            
            <Link href={"/class/001/attendance_taking"}>
                Start
            </Link>
            </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default AlertDialogDemo;
