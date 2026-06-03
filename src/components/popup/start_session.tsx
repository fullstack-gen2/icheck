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
    secondTime: string,
    id: string
}

const AlertDialogDemo = ({btnName,title, firstTime, secondTime, id}: AlertType) => {
  return (
    <AlertDialog >
      <AlertDialogTrigger asChild>
        <Button className='bg-primary p-5'>{btnName}</Button>
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
          <AlertDialogAction asChild>
            <Link href={`/dashboard/classrooms/${id}/take-attendance`}>
                Start
            </Link>
            </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default AlertDialogDemo;
